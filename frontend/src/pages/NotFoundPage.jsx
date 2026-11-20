import React from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";

export default function NotFoundPage() {
    useSeo({ title: "Page not found", noindex: true });
    return (
        <main className="max-w-xl mx-auto px-4 py-24 text-center" data-testid="not-found-page">
            <p className="font-mono text-sm text-muted-foreground mb-3">404</p>
            <h1 className="font-display text-4xl font-bold tracking-tight mb-3">This page doesn't exist</h1>
            <p className="text-muted-foreground mb-8">The link may be old, or the product may have been removed.</p>
            <Link to="/" className="btn-ink inline-flex rounded-md h-11 px-5 items-center text-sm">Back to Tally</Link>
        </main>
    );
}
