import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./CategoryCards";
import { fetchProducts } from "../lib/api";

export const TrendingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts({ trending: true, sort: "value", limit: 8 })
            .then(setProducts)
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="py-16 lg:py-24 border-t border-border" data-testid="trending-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    index="02"
                    title="What people are comparing"
                    aside={
                        <Link to="/search" className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline" data-testid="trending-view-all">
                            See everything <ArrowRight className="w-4 h-4" />
                        </Link>
                    }
                />

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] rounded-lg bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                )}
            </div>
        </section>
    );
};
