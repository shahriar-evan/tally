import React from "react";
import { Hero } from "../components/Hero";
import { CategoryCards } from "../components/CategoryCards";
import { TrendingProducts } from "../components/TrendingProducts";
import { HowItWorks } from "../components/HowItWorks";
import { TrustSection } from "../components/TrustSection";
import { useSeo } from "../hooks/useSeo";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../lib/site";

export default function HomePage() {
    useSeo({
        path: "/",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
            },
        },
    });
    return (
        <main data-testid="home-page">
            <Hero />
            <CategoryCards />
            <TrendingProducts />
            <HowItWorks />
            <TrustSection />
        </main>
    );
}
