import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchCategories } from "../lib/api";

export const SectionHeading = ({ index, title, aside }) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 lg:mb-10">
        <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs text-muted-foreground">{index}</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em]">{title}</h2>
        </div>
        {aside}
    </div>
);

export const CategoryCards = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => {});
    }, []);

    return (
        <section className="py-16 lg:py-24" data-testid="categories-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    index="01"
                    title="Shop by category"
                    aside={<p className="text-sm text-muted-foreground max-w-xs">Pick an aisle. Every product inside is compared across all our stores.</p>}
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            to={`/search?category=${cat.slug}`}
                            className="group block"
                            data-testid={`category-card-${cat.slug}`}
                        >
                            <div className="relative overflow-hidden rounded-lg aspect-[4/5] bg-secondary mb-3">
                                <img
                                    src={cat.image}
                                    alt=""
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-display text-lg font-semibold tracking-tight">{cat.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{cat.subtitle}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 mt-1.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
