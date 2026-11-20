"""Tally backend regression tests covering public, product, redirect, and admin endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://deals-finder-43.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_session(session):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN})
    return s


# ---------- Public: meta ----------
class TestCategories:
    def test_categories_returns_four(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 4
        keys = {"slug", "name", "subtitle", "image"}
        for c in data:
            assert keys.issubset(c.keys())
        slugs = {c["slug"] for c in data}
        assert {"fashion", "electronics", "accessories", "digital"} == slugs


class TestStores:
    def test_stores_returns_five_seeded(self, session):
        r = session.get(f"{API}/stores")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5
        names = {s["name"] for s in data}
        for expected in ["Amazon", "AliExpress", "Daraz", "Shopee", "Lazada"]:
            assert expected in names, f"Missing seeded store {expected}"


# ---------- Public: products ----------
class TestProducts:
    def test_list_products_default_sorted_lowest(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 10
        totals = [p["lowest_total"] for p in data if p.get("lowest_total") is not None]
        assert totals == sorted(totals), "Products must be sorted by lowest_total asc"
        # Schema checks
        first = data[0]
        for k in ("id", "title", "slug", "category", "lowest_total", "store_count"):
            assert k in first

    def test_filter_by_q_iphone(self, session):
        r = session.get(f"{API}/products", params={"q": "iphone"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all("iphone" in p["title"].lower() for p in data)

    def test_filter_by_category(self, session):
        r = session.get(f"{API}/products", params={"category": "electronics"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(p["category"] == "electronics" for p in data)

    def test_trending_true(self, session):
        r = session.get(f"{API}/products", params={"trending": "true"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        # trending should not include non-trending seeded items
        non_trending_slugs = {"levis-501-original", "minimalist-leather-wallet", "notion-templates-pack"}
        slugs = {p["slug"] for p in data}
        assert slugs.isdisjoint(non_trending_slugs)

    def test_sort_by_rating(self, session):
        r = session.get(f"{API}/products", params={"sort": "rating"})
        assert r.status_code == 200
        data = r.json()
        ratings = [p["rating"] for p in data]
        assert ratings == sorted(ratings, reverse=True), "Should be sorted by rating desc"

    def test_price_range_filter(self, session):
        r = session.get(f"{API}/products", params={"min_price": 50, "max_price": 200})
        assert r.status_code == 200
        data = r.json()
        for p in data:
            assert 50 <= p["lowest_total"] <= 200


class TestProductDetail:
    def test_product_detail_with_offers_and_related(self, session):
        # Use a known seeded slug
        slug = "iphone-15-pro-256gb"
        r = session.get(f"{API}/products/{slug}")
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == slug
        assert "offers" in data and len(data["offers"]) >= 1
        # offers sorted by total asc
        totals = [o["total"] for o in data["offers"]]
        assert totals == sorted(totals)
        # each offer enriched
        for o in data["offers"]:
            assert "store_name" in o and "total" in o and "affiliate_url" in o
        assert "related" in data
        assert isinstance(data["related"], list)
        # Related should be same category and exclude self
        for rp in data["related"]:
            assert rp["slug"] != slug

    def test_product_detail_404(self, session):
        r = session.get(f"{API}/products/this-slug-does-not-exist-xyz")
        assert r.status_code == 404


# ---------- Tracking / redirect ----------
class TestTracking:
    def _get_offer(self, session):
        r = session.get(f"{API}/products/iphone-15-pro-256gb")
        assert r.status_code == 200
        return r.json()["offers"][0]

    def test_track_click_post(self, session):
        offer = self._get_offer(session)
        r = session.post(f"{API}/track-click", params={"offer_id": offer["id"]})
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["affiliate_url"] == offer["affiliate_url"]

    def test_track_click_invalid_offer(self, session):
        r = session.post(f"{API}/track-click", params={"offer_id": "non-existent-offer"})
        assert r.status_code == 404

    def test_redirect_302(self, session):
        offer = self._get_offer(session)
        r = session.get(f"{API}/redirect", params={"offer_id": offer["id"]}, allow_redirects=False)
        assert r.status_code in (301, 302, 307)
        assert r.headers.get("location") == offer["affiliate_url"]


# ---------- Admin ----------
class TestAdminAuth:
    def test_verify_no_token(self, session):
        r = session.get(f"{API}/admin/verify")
        assert r.status_code == 401

    def test_verify_wrong_token(self, session):
        r = session.get(f"{API}/admin/verify", headers={"X-Admin-Token": "wrong"})
        assert r.status_code == 401

    def test_verify_valid_token(self, admin_session):
        r = admin_session.get(f"{API}/admin/verify")
        assert r.status_code == 200
        assert r.json()["ok"] is True


class TestAdminCRUD:
    created_product_id = None
    created_store_id = None
    created_offer_id = None

    def test_create_product(self, admin_session):
        payload = {
            "title": "TEST_Product",
            "slug": "test-product-pytest",
            "category": "electronics",
            "description": "TEST",
            "images": [],
            "rating": 4.5,
            "review_count": 0,
            "trending": False,
        }
        r = admin_session.post(f"{API}/admin/products", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Product"
        assert "id" in data
        TestAdminCRUD.created_product_id = data["id"]
        # GET should return 200 for the slug
        rg = admin_session.get(f"{API}/products/test-product-pytest")
        assert rg.status_code == 200

    def test_update_product(self, admin_session):
        pid = TestAdminCRUD.created_product_id
        assert pid
        payload = {
            "title": "TEST_Product_Updated",
            "slug": "test-product-pytest",
            "category": "electronics",
            "description": "Updated",
            "images": [],
            "rating": 4.9,
            "review_count": 5,
            "trending": True,
        }
        r = admin_session.put(f"{API}/admin/products/{pid}", json=payload)
        assert r.status_code == 200
        rg = admin_session.get(f"{API}/products/test-product-pytest")
        assert rg.status_code == 200
        assert rg.json()["title"] == "TEST_Product_Updated"
        assert rg.json()["rating"] == 4.9

    def test_create_store(self, admin_session):
        payload = {"name": "TEST_Store", "country": "US", "rating": 4.0, "affiliate_base": "https://example.com"}
        r = admin_session.post(f"{API}/admin/stores", json=payload)
        assert r.status_code == 200
        TestAdminCRUD.created_store_id = r.json()["id"]
        assert TestAdminCRUD.created_store_id

    def test_create_offer_and_track(self, admin_session):
        pid = TestAdminCRUD.created_product_id
        sid = TestAdminCRUD.created_store_id
        payload = {
            "product_id": pid,
            "store_id": sid,
            "price": 99.99,
            "delivery_fee": 0.0,
            "currency": "USD",
            "affiliate_url": "https://example.com/dp/test?ref=tally",
            "in_stock": True,
        }
        r = admin_session.post(f"{API}/admin/offers", json=payload)
        assert r.status_code == 200
        TestAdminCRUD.created_offer_id = r.json()["id"]
        # Verify offer appears on product detail
        rg = admin_session.get(f"{API}/products/test-product-pytest")
        offers = rg.json()["offers"]
        assert any(o["id"] == TestAdminCRUD.created_offer_id for o in offers)
        # Track a click on it
        rc = admin_session.post(f"{API}/track-click", params={"offer_id": TestAdminCRUD.created_offer_id})
        assert rc.status_code == 200

    def test_admin_clicks_enriched(self, admin_session):
        r = admin_session.get(f"{API}/admin/clicks")
        assert r.status_code == 200
        clicks = r.json()
        assert isinstance(clicks, list)
        if clicks:
            c = clicks[0]
            assert "product_title" in c and "store_name" in c

    def test_delete_offer(self, admin_session):
        oid = TestAdminCRUD.created_offer_id
        r = admin_session.delete(f"{API}/admin/offers/{oid}")
        assert r.status_code == 200

    def test_delete_store(self, admin_session):
        sid = TestAdminCRUD.created_store_id
        r = admin_session.delete(f"{API}/admin/stores/{sid}")
        assert r.status_code == 200

    def test_patch_no_token(self, session):
        # Create then attempt PATCH without token
        r = session.patch(f"{API}/admin/products/some-id", json={"rating": 4.0})
        assert r.status_code == 401

    def test_patch_partial_update(self, admin_session):
        pid = TestAdminCRUD.created_product_id
        r = admin_session.patch(f"{API}/admin/products/{pid}", json={"rating": 4.2})
        assert r.status_code == 200
        data = r.json()
        assert data["rating"] == 4.2
        # other fields preserved
        assert data["title"] == "TEST_Product_Updated"
        # GET to verify persistence
        rg = admin_session.get(f"{API}/products/test-product-pytest")
        assert rg.status_code == 200
        assert rg.json()["rating"] == 4.2

    def test_patch_empty_body_400(self, admin_session):
        pid = TestAdminCRUD.created_product_id
        r = admin_session.patch(f"{API}/admin/products/{pid}", json={})
        assert r.status_code == 400
        assert "No fields to update" in r.json().get("detail", "")

    def test_patch_nonexistent_404(self, admin_session):
        r = admin_session.patch(f"{API}/admin/products/does-not-exist-xyz", json={"rating": 4.1})
        assert r.status_code == 404


# ---------- Deterministic seed ----------
class TestDeterministicSeed:
    def test_iphone_lowest_total_deterministic(self, session):
        r = session.get(f"{API}/products/iphone-15-pro-256gb")
        assert r.status_code == 200
        data = r.json()
        assert data["lowest_total"] == 989.10
        # cheapest offer should be Amazon (slot 0 with -10% variation, 0 delivery)
        assert data["offers"][0]["store_name"] == "Amazon"
        assert data["offers"][0]["total"] == 989.10


class TestAdminCRUDCleanup:
    def test_delete_product_cascades_offers(self, admin_session):
        pid = TestAdminCRUD.created_product_id
        # Create a fresh offer attached to product to verify cascade
        # (Reuse any existing seed store)
        stores = admin_session.get(f"{API}/stores").json()
        seed_store_id = next(s["id"] for s in stores if s["name"] == "Amazon")
        admin_session.post(f"{API}/admin/offers", json={
            "product_id": pid, "store_id": seed_store_id, "price": 10.0,
            "affiliate_url": "https://amazon.com/x"
        })
        r = admin_session.delete(f"{API}/admin/products/{pid}")
        assert r.status_code == 200
        # Verify product gone
        rg = admin_session.get(f"{API}/products/test-product-pytest")
        assert rg.status_code == 404
