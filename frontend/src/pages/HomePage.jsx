import React from "react";
import { Hero } from "../components/Hero";
import { CategoryCards } from "../components/CategoryCards";
import { TrendingProducts } from "../components/TrendingProducts";
import { HowItWorks } from "../components/HowItWorks";
import { TrustSection } from "../components/TrustSection";

export default function HomePage() {
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
