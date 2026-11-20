import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { CURRENCIES } from "../lib/currency";
import { Logo } from "./Logo";
import {
    Select, SelectContent, SelectItem, SelectTrigger
} from "./ui/select";

const LINKS = [
    { slug: "electronics", label: "Electronics" },
    { slug: "fashion", label: "Fashion" },
    { slug: "accessories", label: "Accessories" },
    { slug: "digital", label: "Digital" },
];

export const Navbar = () => {
    const { theme, toggle } = useTheme();
    const { country, setCountry } = useCurrency();
    const navigate = useNavigate();
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);

    const onSearch = (e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`);
        setOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border" data-testid="navbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 h-16">
                    <Link to="/" className="shrink-0" data-testid="nav-logo" aria-label="Tally home">
                        <Logo />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1 text-[14px]">
                        {LINKS.map((l) => (
                            <NavLink
                                key={l.slug}
                                to={`/search?category=${l.slug}`}
                                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                data-testid={`nav-link-${l.slug}`}
                            >
                                {l.label}
                            </NavLink>
                        ))}
                    </nav>

                    <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-sm ml-auto" data-testid="nav-search-form">
                        <label className="relative w-full">
                            <span className="sr-only">Search products</span>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search products"
                                className="w-full h-9 pl-9 pr-12 rounded-md bg-card border border-border focus:outline-none focus:border-foreground/40 text-sm placeholder:text-muted-foreground"
                                data-testid="nav-search-input"
                            />
                            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">↵</kbd>
                        </label>
                    </form>

                    <div className="flex items-center gap-1 ml-auto md:ml-0">
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger
                                className="h-9 w-auto gap-1.5 rounded-md border-border bg-transparent px-2.5 text-xs font-medium font-mono"
                                data-testid="currency-selector"
                                aria-label="Currency"
                            >
                                <span className="text-sm leading-none">{CURRENCIES[country]?.flag}</span>
                                <span className="hidden sm:inline">{CURRENCIES[country]?.code}</span>
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CURRENCIES).map(([code, c]) => (
                                    <SelectItem key={code} value={code} data-testid={`currency-option-${code}`}>
                                        <span className="inline-flex items-center gap-2">
                                            <span>{c.flag}</span>
                                            <span>{c.label}</span>
                                            <span className="text-muted-foreground text-xs font-mono">{c.code}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <button
                            onClick={toggle}
                            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            aria-label="Toggle theme"
                            data-testid="theme-toggle"
                        >
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center hover:bg-secondary"
                            onClick={() => setOpen(!open)}
                            aria-label="Menu"
                            data-testid="mobile-menu-toggle"
                        >
                            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {open && (
                    <div className="lg:hidden pb-4 space-y-3 border-t border-border pt-3" data-testid="mobile-menu">
                        <form onSubmit={onSearch} className="md:hidden">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search products"
                                    className="w-full h-10 pl-9 pr-4 rounded-md bg-card border border-border text-sm"
                                    data-testid="mobile-search-input"
                                />
                            </div>
                        </form>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                            {LINKS.map((l) => (
                                <Link key={l.slug} to={`/search?category=${l.slug}`} className="py-2 px-2 rounded-md hover:bg-secondary" onClick={() => setOpen(false)}>
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
