import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const cols = [
    {
        title: "Shop",
        links: [
            { to: "/search?category=electronics", label: "Electronics" },
            { to: "/search?category=fashion", label: "Fashion" },
            { to: "/search?category=accessories", label: "Accessories" },
            { to: "/search?category=digital", label: "Digital" },
        ],
    },
    {
        title: "Company",
        links: [
            { to: "/", label: "About" },
            { to: "/", label: "Contact" },
            { to: "/admin", label: "Admin", testid: "footer-admin-link" },
        ],
    },
    {
        title: "Legal",
        links: [
            { to: "/", label: "Privacy" },
            { to: "/", label: "Terms" },
            { to: "/", label: "Cookies" },
        ],
    },
];

export const Footer = () => (
    <footer className="border-t border-border" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 mb-14">
                <div className="col-span-2 md:col-span-1">
                    <Link to="/" className="inline-block mb-4" aria-label="Tally home">
                        <Logo />
                    </Link>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        Every store, one total. Price comparison across six countries, delivery included.
                    </p>
                </div>
                {cols.map((c) => (
                    <div key={c.title}>
                        <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">{c.title}</h4>
                        <ul className="space-y-2.5 text-sm">
                            {c.links.map((l) => (
                                <li key={l.label}>
                                    <Link to={l.to} className="hover:text-primary transition-colors" data-testid={l.testid}>{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
                <p>&copy; {new Date().getFullYear()} Tally</p>
                <p>Prices and availability can change on store sites after we last checked.</p>
            </div>
        </div>
    </footer>
);
