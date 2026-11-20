import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Truck, Award, ArrowLeft, ExternalLink, Store } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { fetchProduct, trackClick, API } from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";

export default function ProductDetailPage() {
    const { slug } = useParams();
    const { format } = useCurrency();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchProduct(slug).then(setProduct).finally(() => setLoading(false));
    }, [slug]);

    const handleBuy = async (offerId) => {
        try {
            const res = await trackClick(offerId);
            window.open(res.affiliate_url, "_blank", "noopener");
        } catch {
            window.open(`${API}/redirect?offer_id=${offerId}`, "_blank", "noopener");
        }
    };

    if (loading) {
        return (
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="aspect-square rounded-3xl bg-secondary animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-6 w-32 bg-secondary rounded animate-pulse" />
                        <div className="h-10 w-3/4 bg-secondary rounded animate-pulse" />
                        <div className="h-32 bg-secondary rounded animate-pulse" />
                    </div>
                </div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="max-w-6xl mx-auto px-4 py-20 text-center" data-testid="product-not-found">
                <h1 className="font-display text-3xl font-bold mb-4">Product not found</h1>
                <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
            </main>
        );
    }

    const lowest = product.offers?.[0];

    return (
        <main className="bg-aurora" data-testid="product-detail-page">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <Link to="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="back-link">
                    <ArrowLeft className="w-4 h-4" /> Back to results
                </Link>

                <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
                    <div className="glass rounded-3xl p-6 lg:p-8">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/40">
                            <img
                                src={product.images?.[0]}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                data-testid="product-image"
                            />
                        </div>
                    </div>

                    <div>
                        <Badge variant="outline" className="rounded-full text-[10px] tracking-widest uppercase mb-4">{product.category}</Badge>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4" data-testid="product-title">
                            {product.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm mb-6">
                            <span className="inline-flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{product.rating?.toFixed(1)}</span>
                                <span className="text-muted-foreground">({product.review_count} reviews)</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Store className="w-4 h-4" /> {product.store_count} stores
                            </span>
                        </div>

                        <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

                        {lowest && (
                            <div className="glass-strong rounded-3xl p-6 mb-6" data-testid="lowest-price-card">
                                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Lowest Price</p>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-mono tabular text-4xl lg:text-5xl font-semibold text-accent">{format(lowest.total)}</span>
                                    <span className="text-sm text-muted-foreground">at {lowest.store_name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {format(lowest.price)} + {format(lowest.delivery_fee)} delivery
                                </p>
                                <Button
                                    onClick={() => handleBuy(lowest.id)}
                                    className="btn-ink rounded-md h-12 px-6 mt-5 w-full sm:w-auto"
                                    data-testid="buy-lowest-button"
                                >
                                    Buy Now <ExternalLink className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comparison Table */}
                <section className="mb-16">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                        Every offer, sorted by total
                    </h2>
                    <div className="glass rounded-3xl overflow-hidden" data-testid="comparison-table">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/30">
                                        <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">Store</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">Price</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">Delivery</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">Total</th>
                                        <th className="text-right px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.offers?.map((o, i) => (
                                        <tr
                                            key={o.id}
                                            className={`border-b border-border last:border-0 transition-colors ${i === 0 ? "bg-accent/5" : "hover:bg-secondary/30"}`}
                                            data-testid={`offer-row-${i}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{o.store_name}</span>
                                                    {i === 0 && (
                                                        <Badge className="bg-accent text-accent-foreground hover:bg-accent rounded text-[10px] font-mono uppercase tracking-wider">
                                                            <Award className="w-3 h-3 mr-1" /> Lowest
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {o.store_rating} · {o.store_country}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 font-mono tabular">{format(o.price)}</td>
                                            <td className="px-6 py-5 text-sm text-muted-foreground">
                                                {o.delivery_fee === 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <Truck className="w-3.5 h-3.5" /> Free
                                                    </span>
                                                ) : format(o.delivery_fee)}
                                            </td>
                                            <td className={`px-6 py-5 font-mono tabular font-semibold ${i === 0 ? "text-accent text-lg" : ""}`}>
                                                {format(o.total)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button
                                                    onClick={() => handleBuy(o.id)}
                                                    size="sm"
                                                    className={i === 0 ? "btn-ink rounded-md" : "rounded-md"}
                                                    variant={i === 0 ? "default" : "outline"}
                                                    data-testid={`buy-button-${i}`}
                                                >
                                                    Buy <ExternalLink className="w-3 h-3 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {product.related?.length > 0 && (
                    <section data-testid="related-section">
                        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                            Similar products
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {product.related.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
