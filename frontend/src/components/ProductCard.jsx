import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

export const ProductCard = ({ product, index = 0 }) => {
    const { format } = useCurrency();
    const img = product.images?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80";

    return (
        <Link
            to={`/product/${product.slug}`}
            className="group block animate-fade-up"
            style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
            data-testid={`product-card-${product.slug}`}
        >
            <article className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-foreground/30">
                <div className="relative aspect-square overflow-hidden bg-secondary">
                    <img
                        src={img}
                        alt={product.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {product.trending && (
                        <span className="absolute top-2.5 left-2.5 rounded bg-background/95 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                            Popular
                        </span>
                    )}
                </div>
                <div className="flex-1 flex flex-col p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        {product.category}
                    </p>
                    <h3 className="font-medium text-[15px] leading-snug mb-3 line-clamp-2">
                        {product.title}
                    </h3>
                    <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-dashed border-border">
                        <div>
                            {product.lowest_total != null && (
                                <>
                                    <span className="block text-[11px] text-muted-foreground">
                                        from · {product.store_count} store{product.store_count === 1 ? "" : "s"}
                                    </span>
                                    <span className="font-mono tabular text-lg font-semibold" data-testid={`product-price-badge-${product.slug}`}>
                                        {format(product.lowest_total)}
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                            <span className="text-foreground font-medium">{product.rating?.toFixed(1)}</span>
                            <span>({product.review_count?.toLocaleString()})</span>
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
};
