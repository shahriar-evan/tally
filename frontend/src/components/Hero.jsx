import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import { fetchCategories, fetchProducts, fetchProduct, fetchStores } from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";
import { CURRENCIES } from "../lib/currency";

const COUNTRY_OPTIONS = Object.entries(CURRENCIES).map(([code, c]) => ({ code, label: c.label }));

// A real comparison pulled from the catalogue, styled like a receipt.
const LiveComparison = () => {
    const { format } = useCurrency();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        fetchProducts({ trending: true, sort: "value", limit: 6 })
            .then((list) => {
                const pick = list.find((p) => p.store_count >= 3) || list[0];
                return pick ? fetchProduct(pick.slug) : null;
            })
            .then(setProduct)
            .catch(() => {});
    }, []);

    if (!product) {
        return <div className="aspect-[4/5] lg:aspect-auto lg:h-[460px] rounded-xl border border-border bg-card animate-pulse" />;
    }

    const offers = (product.offers || []).slice(0, 4);
    const lowest = offers[0];
    const highest = offers.reduce((m, o) => (o.total > m ? o.total : m), 0);
    const saving = lowest ? highest - lowest.total : 0;

    return (
        <Link
            to={`/product/${product.slug}`}
            className="group block relative rounded-xl border border-border bg-card shadow-[0_1px_0_hsl(var(--border)),0_24px_48px_-24px_rgba(40,30,20,0.25)] animate-fade-up"
            data-testid="hero-live-comparison"
        >
            <div className="flex items-center gap-4 p-5 border-b border-dashed border-border">
                <img src={product.images?.[0]} alt="" className="w-16 h-16 rounded-md object-cover bg-secondary" />
                <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{product.category}</p>
                    <p className="font-medium leading-snug line-clamp-2">{product.title}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 ml-auto shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            <ul className="px-5 py-2">
                {offers.map((o, i) => (
                    <li key={o.id} className="flex items-center gap-3 py-3 border-b border-border/70 last:border-0 text-sm">
                        <span className="font-mono text-[11px] text-muted-foreground w-5">{String(i + 1).padStart(2, "0")}</span>
                        <span className={i === 0 ? "font-semibold" : ""}>{o.store_name}</span>
                        <span className="text-xs text-muted-foreground">{o.store_country}</span>
                        <span className="ml-auto text-right">
                            <span className={`font-mono tabular ${i === 0 ? "font-semibold text-accent" : i === offers.length - 1 ? "text-muted-foreground line-through decoration-primary/60" : ""}`}>
                                {format(o.total)}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                                {o.delivery_fee === 0 ? "free delivery" : `incl. ${format(o.delivery_fee)} delivery`}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>

            {saving > 0 && (
                <div className="mx-5 mb-5 mt-1 flex items-center justify-between rounded-md bg-accent/10 px-4 py-3">
                    <span className="text-sm">Cheapest vs. priciest</span>
                    <span className="font-mono font-semibold text-accent">−{format(saving)}</span>
                </div>
            )}

            <span className="absolute -top-3 left-5 rounded bg-foreground text-background font-mono text-[10px] uppercase tracking-wider px-2 py-1">
                Live from the catalogue
            </span>
        </Link>
    );
};

export const Hero = () => {
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("all");
    const [country, setCountry] = useState("all");
    const [categories, setCategories] = useState([]);
    const [storeCount, setStoreCount] = useState(null);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(() => {});
        fetchStores().then((s) => setStoreCount(s.length)).catch(() => {});
    }, []);

    const onSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (category !== "all") params.set("category", category);
        if (country !== "all") params.set("country", country);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <section className="relative border-b border-border" data-testid="hero-section">
            <div className="absolute inset-0 -z-10 bg-paper-grid" aria-hidden="true" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center">
                <div>
                    <p className="font-mono text-xs text-muted-foreground mb-6 flex items-center gap-2" data-testid="hero-badge">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
                        {COUNTRY_OPTIONS.length} countries{storeCount ? ` · ${storeCount} stores` : ""} · delivery always included
                    </p>

                    <h1 className="font-display text-[44px] leading-[0.98] sm:text-6xl lg:text-[76px] font-bold tracking-[-0.04em] mb-6">
                        Same product.
                        <br />
                        Different price.
                        <br />
                        <span className="relative inline-block">
                            We do the maths.
                            <svg className="absolute left-0 -bottom-2 w-full h-3 text-primary" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
                                <path d="M2 8 C 60 2, 120 11, 180 5 S 270 4, 298 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-9 leading-relaxed">
                        Tally lines up what each store charges for the same item, adds shipping, and sorts it.
                        The number at the top is what you actually pay.
                    </p>

                    <form
                        onSubmit={onSearch}
                        className="rounded-lg border border-foreground/15 bg-card p-1.5 flex flex-col sm:flex-row gap-1.5 max-w-2xl shadow-sm focus-within:border-foreground/40 transition-colors"
                        data-testid="hero-search-form"
                    >
                        <label className="relative flex-1 min-w-0">
                            <span className="sr-only">Search</span>
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="What are you buying?"
                                className="w-full h-11 pl-10 pr-3 bg-transparent focus:outline-none text-[15px] placeholder:text-muted-foreground"
                                data-testid="hero-search-input"
                            />
                        </label>

                        <div className="flex gap-1.5">
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-11 w-[128px] rounded-md border-0 bg-secondary text-sm" data-testid="hero-category-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any category</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={country} onValueChange={setCountry}>
                                <SelectTrigger className="h-11 w-[118px] rounded-md border-0 bg-secondary text-sm" data-testid="hero-country-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Anywhere</SelectItem>
                                    {COUNTRY_OPTIONS.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <button
                                type="submit"
                                className="btn-ink rounded-md h-11 px-5 text-sm whitespace-nowrap"
                                data-testid="hero-search-button"
                            >
                                Compare
                            </button>
                        </div>
                    </form>

                    {categories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-5 text-sm" data-testid="hero-trust-row">
                            <span className="text-muted-foreground mr-1">Browse</span>
                            {categories.map((c) => (
                                <Link
                                    key={c.slug}
                                    to={`/search?category=${c.slug}`}
                                    className="px-3 py-1 rounded-full border border-border hover:border-foreground/40 hover:bg-card transition-colors"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <LiveComparison />
            </div>
        </section>
    );
};
