import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { fetchProducts, fetchCategories, fetchStores } from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { format } = useCurrency();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [q, setQ] = useState(searchParams.get("q") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "all");
    const [country, setCountry] = useState(searchParams.get("country") || "all");
    const [storeFilter, setStoreFilter] = useState(searchParams.get("store") || "all");
    const [priceRange, setPriceRange] = useState([0, 2000]);
    const [sort, setSort] = useState(searchParams.get("sort") || "lowest");

    useEffect(() => {
        fetchCategories().then(setCategories);
        fetchStores().then(setStores);
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        fetchProducts({
            q: q || undefined,
            category: category !== "all" ? category : undefined,
            store: storeFilter !== "all" ? storeFilter : undefined,
            country: country !== "all" ? country : undefined,
            min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
            max_price: priceRange[1] < 2000 ? priceRange[1] : undefined,
            sort,
        }).then(setProducts).finally(() => setLoading(false));
    }, [q, category, storeFilter, country, priceRange, sort]);

    useEffect(() => { load(); }, [load]);

    const applyFromUrl = () => {
        setQ(searchParams.get("q") || "");
        setCategory(searchParams.get("category") || "all");
        setCountry(searchParams.get("country") || "all");
    };
    useEffect(() => { applyFromUrl(); /* eslint-disable-next-line */ }, [searchParams]);

    const onSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (category !== "all") params.set("category", category);
        if (country !== "all") params.set("country", country);
        setSearchParams(params);
    };

    const reset = () => {
        setQ(""); setCategory("all"); setCountry("all"); setStoreFilter("all"); setPriceRange([0, 2000]); setSort("lowest");
        setSearchParams({});
    };

    const FiltersPanel = () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-display font-semibold text-sm mb-3">Country</h3>
                <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger data-testid="filter-country" className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CN">China</SelectItem>
                        <SelectItem value="BD">Bangladesh</SelectItem>
                        <SelectItem value="PK">Pakistan</SelectItem>
                        <SelectItem value="SG">Singapore</SelectItem>
                        <SelectItem value="MY">Malaysia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <h3 className="font-display font-semibold text-sm mb-3">Category</h3>
                <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <Checkbox
                            checked={category === "all"}
                            onCheckedChange={() => setCategory("all")}
                            data-testid="filter-category-all"
                        />
                        <span>All categories</span>
                    </label>
                    {categories.map(c => (
                        <label key={c.slug} className="flex items-center gap-2.5 text-sm cursor-pointer">
                            <Checkbox
                                checked={category === c.slug}
                                onCheckedChange={() => setCategory(c.slug)}
                                data-testid={`filter-category-${c.slug}`}
                            />
                            <span>{c.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-display font-semibold text-sm mb-3">Store</h3>
                <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <Checkbox
                            checked={storeFilter === "all"}
                            onCheckedChange={() => setStoreFilter("all")}
                        />
                        <span>All stores</span>
                    </label>
                    {stores.map(s => (
                        <label key={s.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                            <Checkbox
                                checked={storeFilter === s.id}
                                onCheckedChange={() => setStoreFilter(s.id)}
                                data-testid={`filter-store-${s.name.toLowerCase()}`}
                            />
                            <span>{s.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display font-semibold text-sm">Price range</h3>
                    <span className="text-xs text-muted-foreground">{format(priceRange[0])} - {format(priceRange[1])}</span>
                </div>
                <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={2000}
                    step={10}
                    data-testid="filter-price-slider"
                />
            </div>

            <Button onClick={reset} variant="outline" className="w-full rounded-xl" data-testid="filter-reset">
                Reset filters
            </Button>
        </div>
    );

    return (
        <main className="bg-aurora min-h-screen" data-testid="search-page">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
                <form onSubmit={onSubmit} className="glass-strong rounded-3xl p-2.5 flex gap-2 mb-8" data-testid="search-form">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search products..."
                            className="w-full h-11 pl-11 pr-4 rounded-2xl bg-transparent focus:outline-none text-sm"
                            data-testid="search-input"
                        />
                    </div>
                    <Button type="submit" className="btn-ink rounded-md h-11 px-6" data-testid="search-submit">Search</Button>
                </form>

                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-muted-foreground" data-testid="results-count">
                        <span className="font-semibold text-foreground">{products.length}</span> products found
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm"
                            data-testid="mobile-filters-trigger"
                        >
                            <SlidersHorizontal className="w-4 h-4" /> Filters
                        </button>
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="w-[180px] rounded-xl" data-testid="sort-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="value">Best value</SelectItem>
                                <SelectItem value="lowest">Lowest price</SelectItem>
                                <SelectItem value="rating">Highest rating</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[260px_1fr] gap-8">
                    <aside className="hidden lg:block glass rounded-3xl p-6 h-fit sticky top-24" data-testid="sidebar-filters">
                        <FiltersPanel />
                    </aside>

                    {showMobileFilters && (
                        <div className="fixed inset-0 z-50 lg:hidden" data-testid="mobile-filters-panel">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background p-6 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="font-display font-semibold text-lg">Filters</h2>
                                    <button onClick={() => setShowMobileFilters(false)} className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <FiltersPanel />
                            </div>
                        </div>
                    )}

                    <div>
                        {loading ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="aspect-[3/4] rounded-3xl bg-secondary animate-pulse" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="glass rounded-3xl p-12 text-center" data-testid="empty-results">
                                <p className="text-lg font-display font-semibold mb-2">No products found</p>
                                <p className="text-sm text-muted-foreground mb-5">Try adjusting your filters or search term.</p>
                                <Button onClick={reset} variant="outline" className="rounded-xl">Clear filters</Button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="product-grid">
                                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
