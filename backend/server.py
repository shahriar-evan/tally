from fastapi import FastAPI, APIRouter, HTTPException, Header, Query, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
from urllib.parse import quote_plus, urlsplit, urlunsplit, parse_qsl, urlencode
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Missing MONGO_URL no longer crashes the whole API: routes that don't touch the
# database (like /api/geo) keep working, and DB calls fail fast instead of hanging.
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    logging.getLogger(__name__).error("MONGO_URL is not set; database routes will fail")
client = AsyncIOMotorClient(mongo_url or "mongodb://localhost:27017", serverSelectionTimeoutMS=8000)
db = client[os.environ.get('DB_NAME') or 'tally']

ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')  # required; admin routes stay locked without it

app = FastAPI(title="Tally API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
def _check_http_url(v: Optional[str]) -> Optional[str]:
    """Only allow plain http(s) links, so nothing like javascript: can reach a Buy button."""
    if v is None:
        return v
    v = v.strip()
    if v == "":
        return None
    if urlsplit(v).scheme not in ("http", "https"):
        raise ValueError("Link must start with http:// or https://")
    return v


def _check_tracking_param(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip().lstrip("?&")
    if v == "":
        return None
    pairs = parse_qsl(v, keep_blank_values=False)
    if not pairs:
        raise ValueError("Tracking ID must look like key=value, e.g. tag=yourid-20")
    return urlencode(pairs)


class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str
    logo: Optional[str] = None
    rating: float = 4.5
    affiliate_base: Optional[str] = None
    # Store search page with {q} where the product name goes. Used when an offer has no affiliate link yet.
    search_url: Optional[str] = None
    # Affiliate tracking parameter added to every outgoing link for this store, e.g. "tag=yourid-20".
    tracking_param: Optional[str] = None


class StoreCreate(BaseModel):
    name: str
    country: str
    logo: Optional[str] = None
    rating: float = 4.5
    affiliate_base: Optional[str] = None
    search_url: Optional[str] = None
    tracking_param: Optional[str] = None

    @field_validator("search_url")
    @classmethod
    def check_search_url(cls, v):
        return _check_http_url(v)

    @field_validator("tracking_param")
    @classmethod
    def check_tracking(cls, v):
        return _check_tracking_param(v)


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    rating: Optional[float] = None
    search_url: Optional[str] = None
    tracking_param: Optional[str] = None

    @field_validator("search_url")
    @classmethod
    def check_search_url(cls, v):
        return _check_http_url(v)

    @field_validator("tracking_param")
    @classmethod
    def check_tracking(cls, v):
        return _check_tracking_param(v)


class Offer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    store_id: str
    price: float
    delivery_fee: float = 0.0
    currency: str = "USD"
    affiliate_url: str
    # True once a real affiliate link from the store's program has been added for this offer.
    is_affiliate: bool = False
    in_stock: bool = True


class OfferCreate(BaseModel):
    product_id: str
    store_id: str
    price: float
    delivery_fee: float = 0.0
    currency: str = "USD"
    affiliate_url: Optional[str] = None  # leave empty to use the store's search page
    in_stock: bool = True

    @field_validator("affiliate_url")
    @classmethod
    def check_url(cls, v):
        return _check_http_url(v)


class OfferUpdate(BaseModel):
    price: Optional[float] = None
    delivery_fee: Optional[float] = None
    in_stock: Optional[bool] = None
    # Send "" to remove the affiliate link and fall back to the store's search page.
    affiliate_url: Optional[str] = None

    @field_validator("affiliate_url")
    @classmethod
    def check_url(cls, v):
        return "" if v is not None and v.strip() == "" else _check_http_url(v)


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    category: str
    description: str = ""
    images: List[str] = []
    rating: float = 4.5
    review_count: int = 0
    trending: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductCreate(BaseModel):
    title: str
    slug: str
    category: str
    description: str = ""
    images: List[str] = []
    rating: float = 4.5
    review_count: int = 0
    trending: bool = False


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    trending: Optional[bool] = None


class Click(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    offer_id: str
    product_id: str
    store_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductWithOffers(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    description: str
    images: List[str]
    rating: float
    review_count: int
    trending: bool
    lowest_total: Optional[float] = None
    store_count: int = 0
    offers: List[dict] = []


# ---------- Admin auth ----------
def check_admin(token: Optional[str]):
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ---------- Outgoing links ----------
DEFAULT_SEARCH_URLS = {
    "Amazon": "https://www.amazon.com/s?k={q}",
    "AliExpress": "https://www.aliexpress.com/w/wholesale.html?SearchText={q}",
    "Daraz": "https://www.daraz.pk/catalog/?q={q}",
    "Daraz BD": "https://www.daraz.com.bd/catalog/?q={q}",
    "Shopee": "https://shopee.sg/search?keyword={q}",
    "Lazada": "https://www.lazada.com.my/catalog/?q={q}",
}


def store_search_link(store: dict, product_title: str) -> str:
    template = store.get("search_url") or DEFAULT_SEARCH_URLS.get(store.get("name", ""))
    if template and "{q}" in template:
        return template.replace("{q}", quote_plus(product_title))
    base = (store.get("affiliate_base") or "https://www.google.com").rstrip("/")
    return f"{base}/search?q={quote_plus(product_title)}"


def with_tracking(url: str, tracking_param: Optional[str]) -> str:
    """Add the store's affiliate tracking parameter unless the link already carries that key."""
    if not tracking_param:
        return url
    parts = urlsplit(url)
    query = parse_qsl(parts.query, keep_blank_values=True)
    existing = {k for k, _ in query}
    query += [(k, v) for k, v in parse_qsl(tracking_param) if k not in existing]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


async def outbound_url(offer: dict) -> str:
    store = await db.stores.find_one({"id": offer["store_id"]}, {"_id": 0}) or {}
    url = offer.get("affiliate_url")
    if not url:
        product = await db.products.find_one({"id": offer["product_id"]}, {"_id": 0, "title": 1}) or {}
        url = store_search_link(store, product.get("title", ""))
    return with_tracking(url, store.get("tracking_param"))


# ---------- Helpers ----------
async def enrich_product(p: dict, include_offers: bool = False) -> dict:
    offers = await db.offers.find({"product_id": p["id"]}, {"_id": 0}).to_list(100)
    stores_by_id = {}
    if offers:
        store_ids = list({o["store_id"] for o in offers})
        async for s in db.stores.find({"id": {"$in": store_ids}}, {"_id": 0}):
            stores_by_id[s["id"]] = s

    enriched_offers = []
    totals = []
    for o in offers:
        total = round(o["price"] + o.get("delivery_fee", 0.0), 2)
        totals.append(total)
        s = stores_by_id.get(o["store_id"], {})
        enriched_offers.append({
            **o,
            "total": total,
            "store_name": s.get("name", "Unknown"),
            "store_country": s.get("country", ""),
            "store_rating": s.get("rating", 0),
            "store_logo": s.get("logo"),
        })
    enriched_offers.sort(key=lambda x: x["total"])

    result = {
        "id": p["id"],
        "title": p["title"],
        "slug": p["slug"],
        "category": p["category"],
        "description": p.get("description", ""),
        "images": p.get("images", []),
        "rating": p.get("rating", 4.5),
        "review_count": p.get("review_count", 0),
        "trending": p.get("trending", False),
        "lowest_total": min(totals) if totals else None,
        "store_count": len(enriched_offers),
    }
    if include_offers:
        result["offers"] = enriched_offers
    return result


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"message": "Tally API", "version": "1.0"}


@api_router.get("/geo")
async def geo(request: Request):
    """Visitor's country from the hosting edge (Vercel or Cloudflare), used to pick a default currency."""
    country = request.headers.get("x-vercel-ip-country") or request.headers.get("cf-ipcountry")
    country = country.upper() if country and len(country) == 2 and country.isalpha() else None
    return {"country": country}


@api_router.get("/categories")
async def get_categories():
    return [
        {"slug": "fashion", "name": "Fashion", "subtitle": "Trendy clothing and apparel",
         "image": "https://images.pexels.com/photos/17016524/pexels-photo-17016524.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
        {"slug": "electronics", "name": "Electronics", "subtitle": "Latest tech gadgets and accessories",
         "image": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1200&q=80"},
        {"slug": "accessories", "name": "Accessories", "subtitle": "Stylish bags, wallets, and more",
         "image": "https://images.unsplash.com/photo-1611688599669-e0d5a0497670?auto=format&fit=crop&w=1200&q=80"},
        {"slug": "digital", "name": "Digital", "subtitle": "E-books, courses, and templates",
         "image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80"},
    ]


@api_router.get("/stores")
async def get_stores():
    stores = await db.stores.find({}, {"_id": 0}).to_list(100)
    return stores


@api_router.get("/products")
async def get_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    store: Optional[str] = None,
    country: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "lowest",
    trending: Optional[bool] = None,
    limit: int = 50,
):
    query = {}
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    if category and category != "all":
        query["category"] = category
    if trending is not None:
        query["trending"] = trending

    products = await db.products.find(query, {"_id": 0}).to_list(500)
    enriched = []
    for p in products:
        ep = await enrich_product(p, include_offers=False)
        if store and store != "all":
            offers = await db.offers.find({"product_id": p["id"], "store_id": store}, {"_id": 0}).to_list(10)
            if not offers:
                continue
        if country and country != "all":
            sids = [s["id"] async for s in db.stores.find({"country": country}, {"_id": 0})]
            offers = await db.offers.find({"product_id": p["id"], "store_id": {"$in": sids}}, {"_id": 0}).to_list(10)
            if not offers:
                continue
        if ep["lowest_total"] is None:
            continue
        if min_price is not None and ep["lowest_total"] < min_price:
            continue
        if max_price is not None and ep["lowest_total"] > max_price:
            continue
        enriched.append(ep)

    if sort == "rating":
        enriched.sort(key=lambda x: -x["rating"])
    elif sort == "value":
        # "Best value": cheap items with high rating come first.
        # Score = price / rating (lower is better)
        enriched.sort(key=lambda x: (x["lowest_total"] or 1e9) / max(x["rating"] or 1, 1))
    else:
        enriched.sort(key=lambda x: (x["lowest_total"] is None, x["lowest_total"] or 0))

    return enriched[:limit]


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    enriched = await enrich_product(p, include_offers=True)

    related = await db.products.find(
        {"category": p["category"], "slug": {"$ne": slug}}, {"_id": 0}
    ).to_list(8)
    related_enriched = [await enrich_product(r, include_offers=False) for r in related[:4]]
    enriched["related"] = related_enriched
    return enriched


@api_router.get("/redirect")
async def redirect_to_store(offer_id: str):
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    click = Click(
        offer_id=offer_id,
        product_id=offer["product_id"],
        store_id=offer["store_id"],
    )
    await db.clicks.insert_one(click.model_dump())

    return RedirectResponse(url=await outbound_url(offer), status_code=302)


@api_router.post("/track-click")
async def track_click(offer_id: str):
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    click = Click(
        offer_id=offer_id,
        product_id=offer["product_id"],
        store_id=offer["store_id"],
    )
    await db.clicks.insert_one(click.model_dump())
    return {"ok": True, "affiliate_url": await outbound_url(offer)}


# ---------- Admin routes ----------
@api_router.post("/admin/products")
async def admin_create_product(p: ProductCreate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    product = Product(**p.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, p: ProductCreate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    res = await db.products.update_one({"id": product_id}, {"$set": p.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


@api_router.patch("/admin/products/{product_id}")
async def admin_patch_product(product_id: str, p: ProductUpdate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    update = {k: v for k, v in p.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    res = await db.products.update_one({"id": product_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    await db.products.delete_one({"id": product_id})
    await db.offers.delete_many({"product_id": product_id})
    return {"ok": True}


@api_router.post("/admin/stores")
async def admin_create_store(s: StoreCreate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    store = Store(**s.model_dump())
    await db.stores.insert_one(store.model_dump())
    return store


@api_router.patch("/admin/stores/{store_id}")
async def admin_update_store(store_id: str, s: StoreUpdate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    update = {k: v for k, v in s.model_dump(exclude_unset=True).items()}
    if not update:
        raise HTTPException(400, "No fields to update")
    res = await db.stores.update_one({"id": store_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Store not found")
    return await db.stores.find_one({"id": store_id}, {"_id": 0})


@api_router.delete("/admin/stores/{store_id}")
async def admin_delete_store(store_id: str, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    await db.stores.delete_one({"id": store_id})
    return {"ok": True}


@api_router.post("/admin/offers")
async def admin_create_offer(o: OfferCreate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    data = o.model_dump()
    if data.get("affiliate_url"):
        data["is_affiliate"] = True
    else:
        store = await db.stores.find_one({"id": o.store_id}, {"_id": 0}) or {}
        product = await db.products.find_one({"id": o.product_id}, {"_id": 0}) or {}
        data["affiliate_url"] = store_search_link(store, product.get("title", ""))
        data["is_affiliate"] = False
    offer = Offer(**data)
    await db.offers.insert_one(offer.model_dump())
    return offer


@api_router.get("/admin/offers")
async def admin_list_offers(x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    offers = await db.offers.find({}, {"_id": 0}).to_list(2000)
    products = {p["id"]: p async for p in db.products.find({}, {"_id": 0, "id": 1, "title": 1, "slug": 1})}
    stores = {s["id"]: s async for s in db.stores.find({}, {"_id": 0})}
    result = []
    for o in offers:
        store = stores.get(o["store_id"], {})
        result.append({
            **o,
            "is_affiliate": bool(o.get("is_affiliate")),
            "product_title": products.get(o["product_id"], {}).get("title", "Unknown"),
            "product_slug": products.get(o["product_id"], {}).get("slug"),
            "store_name": store.get("name", "Unknown"),
            "store_country": store.get("country", ""),
            "final_url": with_tracking(o["affiliate_url"], store.get("tracking_param")),
            "total": round(o["price"] + o.get("delivery_fee", 0.0), 2),
        })
    result.sort(key=lambda x: (x["product_title"], x["total"]))
    return result


@api_router.patch("/admin/offers/{offer_id}")
async def admin_update_offer(offer_id: str, o: OfferUpdate, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(404, "Offer not found")
    update = {k: v for k, v in o.model_dump(exclude_unset=True).items() if k != "affiliate_url" and v is not None}
    if "affiliate_url" in o.model_fields_set:
        if o.affiliate_url:
            update["affiliate_url"] = o.affiliate_url
            update["is_affiliate"] = True
        else:
            store = await db.stores.find_one({"id": offer["store_id"]}, {"_id": 0}) or {}
            product = await db.products.find_one({"id": offer["product_id"]}, {"_id": 0}) or {}
            update["affiliate_url"] = store_search_link(store, product.get("title", ""))
            update["is_affiliate"] = False
    if not update:
        raise HTTPException(400, "No fields to update")
    await db.offers.update_one({"id": offer_id}, {"$set": update})
    return await db.offers.find_one({"id": offer_id}, {"_id": 0})


@api_router.delete("/admin/offers/{offer_id}")
async def admin_delete_offer(offer_id: str, x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    await db.offers.delete_one({"id": offer_id})
    return {"ok": True}


@api_router.get("/admin/clicks")
async def admin_get_clicks(x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    clicks = await db.clicks.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)
    products = {p["id"]: p async for p in db.products.find({}, {"_id": 0})}
    stores = {s["id"]: s async for s in db.stores.find({}, {"_id": 0})}
    enriched = []
    for c in clicks:
        enriched.append({
            **c,
            "product_title": products.get(c["product_id"], {}).get("title", "Unknown"),
            "store_name": stores.get(c["store_id"], {}).get("name", "Unknown"),
        })
    return enriched


@api_router.get("/admin/verify")
async def admin_verify(x_admin_token: Optional[str] = Header(None)):
    check_admin(x_admin_token)
    return {"ok": True}


# ---------- Seed data ----------
async def seed_data():
    if await db.products.count_documents({}) > 0:
        return

    stores_data = [
        {"name": "Amazon", "country": "US", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", "rating": 4.7, "affiliate_base": "https://amazon.com"},
        {"name": "AliExpress", "country": "CN", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/04/Aliexpress_logo.svg", "rating": 4.3, "affiliate_base": "https://aliexpress.com"},
        {"name": "Daraz", "country": "PK", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Daraz_Logo.svg/2560px-Daraz_Logo.svg.png", "rating": 4.2, "affiliate_base": "https://daraz.pk"},
        {"name": "Shopee", "country": "SG", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/01/Shopee.svg", "rating": 4.4, "affiliate_base": "https://shopee.sg"},
        {"name": "Lazada", "country": "MY", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Lazada_%282019%29.svg/2560px-Lazada_%282019%29.svg.png", "rating": 4.3, "affiliate_base": "https://lazada.com"},
        {"name": "Daraz BD", "country": "BD", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Daraz_Logo.svg/2560px-Daraz_Logo.svg.png", "rating": 4.4, "affiliate_base": "https://daraz.com.bd"},
    ]
    store_objs = [Store(**s) for s in stores_data]
    await db.stores.insert_many([s.model_dump() for s in store_objs])

    products_data = [
        {"title": "Apple iPhone 15 Pro 256GB", "slug": "iphone-15-pro-256gb", "category": "electronics",
         "description": "Latest A17 Pro chip, titanium design, 48MP camera, 6.1\" Super Retina XDR display.",
         "images": ["https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.8, "review_count": 1240, "trending": True, "base_price": 1099},
        {"title": "Sony WH-1000XM5 Wireless Headphones", "slug": "sony-wh-1000xm5", "category": "electronics",
         "description": "Industry-leading noise cancellation, 30-hour battery, premium audio quality.",
         "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 980, "trending": True, "base_price": 399},
        {"title": "MacBook Air M3 13-inch", "slug": "macbook-air-m3-13", "category": "electronics",
         "description": "Powered by M3 chip, 18-hour battery, stunning Liquid Retina display.",
         "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.9, "review_count": 760, "trending": True, "base_price": 1199},
        {"title": "Nike Air Max 270 Sneakers", "slug": "nike-air-max-270", "category": "fashion",
         "description": "Iconic Air Max cushioning, breathable mesh upper, all-day comfort.",
         "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.6, "review_count": 2340, "trending": True, "base_price": 150},
        {"title": "Levi's 501 Original Fit Jeans", "slug": "levis-501-original", "category": "fashion",
         "description": "The original blue jean. Straight leg, button fly, 100% cotton denim.",
         "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.5, "review_count": 1820, "trending": False, "base_price": 69},
        {"title": "Premium Leather Crossbody Bag", "slug": "leather-crossbody-bag", "category": "accessories",
         "description": "Handcrafted full-grain leather, adjustable strap, multiple compartments.",
         "images": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 540, "trending": True, "base_price": 189},
        {"title": "Ray-Ban Aviator Classic Sunglasses", "slug": "rayban-aviator-classic", "category": "accessories",
         "description": "Timeless aviator design, polarized lenses, gold metal frame.",
         "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.8, "review_count": 1450, "trending": True, "base_price": 169},
        {"title": "Minimalist Leather Wallet", "slug": "minimalist-leather-wallet", "category": "accessories",
         "description": "RFID-blocking, slim profile, holds 8 cards. Made from Italian leather.",
         "images": ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.5, "review_count": 670, "trending": False, "base_price": 49},
        {"title": "Complete Web Development Course Bundle", "slug": "web-dev-course-bundle", "category": "digital",
         "description": "100+ hours of HD video, lifetime access, project files included.",
         "images": ["https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.9, "review_count": 3200, "trending": True, "base_price": 89},
        {"title": "Productivity Notion Templates Pack", "slug": "notion-templates-pack", "category": "digital",
         "description": "50+ Notion templates for life, work, and business. Instant download.",
         "images": ["https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.6, "review_count": 880, "trending": False, "base_price": 39},
        # --- Additional trending value picks (cheap + high rating, surface first by default sort) ---
        {"title": "Anker PowerCore 20K Power Bank", "slug": "anker-powercore-20k", "category": "electronics",
         "description": "20,000mAh portable charger with PowerIQ fast charging — charges iPhone 7+ times.",
         "images": ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 5840, "trending": True, "base_price": 49},
        {"title": "Xiaomi Redmi Note 13 Pro 256GB", "slug": "redmi-note-13-pro-256gb", "category": "electronics",
         "description": "200MP camera, 120Hz AMOLED display, 67W fast charging — flagship features at mid-range price.",
         "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.6, "review_count": 3210, "trending": True, "base_price": 279},
        {"title": "Apple AirPods Pro (2nd Gen)", "slug": "airpods-pro-2", "category": "electronics",
         "description": "Active noise cancellation, adaptive transparency, MagSafe charging case.",
         "images": ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.8, "review_count": 6720, "trending": True, "base_price": 229},
        {"title": "Apple Watch Series 9 GPS 41mm", "slug": "apple-watch-series-9-41mm", "category": "electronics",
         "description": "Brighter display, S9 chip, double-tap gesture, advanced health tracking.",
         "images": ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 2410, "trending": True, "base_price": 399},
        {"title": "Adidas Ultraboost 22 Running Shoes", "slug": "adidas-ultraboost-22", "category": "fashion",
         "description": "Boost midsole, Primeknit upper, energy return for every stride.",
         "images": ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.6, "review_count": 1890, "trending": True, "base_price": 180},
        {"title": "Uniqlo Heattech Crew Neck T-Shirt", "slug": "uniqlo-heattech-tee", "category": "fashion",
         "description": "Heat-retaining fabric, lightweight, perfect base layer. Best-seller worldwide.",
         "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.5, "review_count": 4520, "trending": True, "base_price": 19},
        {"title": "Casio G-Shock GA-2100 Watch", "slug": "casio-gshock-ga2100", "category": "accessories",
         "description": "Octagonal carbon core guard structure, 200m water resistance, 'CasiOak' icon.",
         "images": ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.8, "review_count": 3870, "trending": True, "base_price": 99},
        {"title": "Stanley Quencher H2.0 Tumbler 40oz", "slug": "stanley-quencher-40oz", "category": "accessories",
         "description": "Vacuum insulated, keeps drinks cold 11 hours / hot 7 hours. Viral favourite.",
         "images": ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 9120, "trending": True, "base_price": 45},
        {"title": "Premium Resume Templates (50 designs)", "slug": "premium-resume-templates", "category": "digital",
         "description": "ATS-friendly, Word + Pages + Figma formats, lifetime updates.",
         "images": ["https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.7, "review_count": 1430, "trending": True, "base_price": 15},
        {"title": "Lightroom Mobile Presets Mega Pack", "slug": "lightroom-presets-mega-pack", "category": "digital",
         "description": "300+ cinematic, vintage and portrait presets. One-click stunning edits.",
         "images": ["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80"],
         "rating": 4.8, "review_count": 2180, "trending": True, "base_price": 24},
    ]

    # Deterministic offer generation: fixed variation patterns per slot, applied
    # consistently across products so demos and tests stay stable across resets.
    price_variations = [-0.10, 0.05, -0.04, 0.12, -0.02]   # 5 slots, lowest store rotates
    delivery_slots = [0.0, 4.99, 0.0, 6.99, 9.99]
    # One offer-count per product, cycles for the full catalog (20 products now)
    n_offers_pattern = [4, 3, 5, 4, 3, 4, 3, 5, 4, 3,
                        5, 4, 3, 4, 3, 5, 4, 3, 4, 5]

    for idx, p_data in enumerate(products_data):
        base_price = p_data.pop("base_price")
        product = Product(**p_data)
        await db.products.insert_one(product.model_dump())

        n_offers = n_offers_pattern[idx % len(n_offers_pattern)]
        # Rotate which stores get this product so each product has a different mix
        chosen = [store_objs[(idx + i) % len(store_objs)] for i in range(n_offers)]
        for slot, s in enumerate(chosen):
            variation = price_variations[slot % len(price_variations)]
            price = round(base_price * (1 + variation), 2)
            delivery = delivery_slots[slot % len(delivery_slots)]
            affiliate_url = store_search_link(s.model_dump(), product.title)
            offer = Offer(
                product_id=product.id,
                store_id=s.id,
                price=price,
                delivery_fee=delivery,
                affiliate_url=affiliate_url,
            )
            await db.offers.insert_one(offer.model_dump())

    logger.info("Seeded sample data successfully")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def migrate_links():
    """Fill in store search pages and replace the old placeholder /dp/ links that went nowhere."""
    stores = {s["id"]: s async for s in db.stores.find({}, {"_id": 0})}
    for s in stores.values():
        if not s.get("search_url") and s.get("name") in DEFAULT_SEARCH_URLS:
            s["search_url"] = DEFAULT_SEARCH_URLS[s["name"]]
            await db.stores.update_one({"id": s["id"]}, {"$set": {"search_url": s["search_url"]}})
    async for o in db.offers.find({"affiliate_url": {"$regex": r"/dp/.*ref=(pricexa|tally)"}}, {"_id": 0}):
        product = await db.products.find_one({"id": o["product_id"]}, {"_id": 0, "title": 1}) or {}
        await db.offers.update_one(
            {"id": o["id"]},
            {"$set": {"affiliate_url": store_search_link(stores.get(o["store_id"], {}), product.get("title", "")), "is_affiliate": False}},
        )


# Seed lazily on the first API request: serverless hosts (Vercel) don't always run startup hooks.
_seeded = False


@app.middleware("http")
async def ensure_seeded(request, call_next):
    global _seeded
    if not _seeded and request.url.path.startswith("/api") and request.url.path != "/api/geo":
        try:
            await seed_data()
            await migrate_links()
            _seeded = True
        except Exception:
            logger.exception("Seeding failed")
    return await call_next(request)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
