import React from "react";
import { Link, NavLink } from "react-router-dom";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "../lib/site";
import { useSeo } from "../hooks/useSeo";

const PAGES = [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/privacy", label: "Privacy" },
    { to: "/terms", label: "Terms" },
    { to: "/affiliate-disclosure", label: "Affiliate disclosure" },
];

export const LegalLayout = ({ title, description, path, intro, showUpdated = true, children }) => {
    useSeo({ title, description, path });
    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" data-testid={`page-${path.slice(1)}`}>
            <div className="grid lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
                <nav aria-label="Company pages" className="lg:sticky lg:top-24 self-start">
                    <ul className="flex flex-wrap lg:flex-col gap-1 text-sm">
                        {PAGES.map((p) => (
                            <li key={p.to}>
                                <NavLink
                                    to={p.to}
                                    className={({ isActive }) =>
                                        `block px-3 py-1.5 rounded-md transition-colors ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
                                    }
                                >
                                    {p.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <article className="min-w-0 max-w-[68ch]">
                    <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-4">{title}</h1>
                    {showUpdated && <p className="font-mono text-xs text-muted-foreground mb-8">Last updated {LEGAL_UPDATED}</p>}
                    {intro && <p className="text-lg text-muted-foreground leading-relaxed mb-10">{intro}</p>}
                    <div className="legal-prose">{children}</div>
                </article>
            </div>
        </main>
    );
};

export const H2 = ({ children }) => <h2 className="font-display text-2xl font-semibold tracking-tight mt-10 mb-3">{children}</h2>;
export const P = ({ children }) => <p className="leading-relaxed mb-4">{children}</p>;
export const UL = ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4 leading-relaxed marker:text-muted-foreground">{children}</ul>;

// "email us at x" when an address is set, otherwise a link to the contact page.
export const ContactLine = () =>
    CONTACT_EMAIL ? (
        <>email us at <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></>
    ) : (
        <>reach us through the <Link className="underline underline-offset-4" to="/contact">contact page</Link></>
    );
