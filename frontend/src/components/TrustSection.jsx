import React from "react";
import { SectionHeading } from "./CategoryCards";

const notes = [
    {
        q: "Which stores do you list?",
        a: "Stores we've checked ourselves: real address, working checkout and sensible delivery times. If a store stops meeting that, it comes off.",
    },
    {
        q: "Is the price I see the price I pay?",
        a: "It's the store's price plus its delivery fee. Taxes and import duties depend on where you live and are added by the store at checkout.",
    },
    {
        q: "How does Tally make money?",
        a: "Some stores pay us a small referral fee when you buy through a link. It never changes the order of results: cheapest total is always first.",
    },
    {
        q: "Can I see prices in my currency?",
        a: "Yes. Use the currency switch in the top bar. Conversions use a fixed reference rate, so the store's own figure may differ slightly.",
    },
];

export const TrustSection = () => (
    <section className="py-16 lg:py-24" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading index="04" title="Fair questions" />
            <dl className="grid md:grid-cols-2 border-t border-border">
                {notes.map((n, i) => (
                    <div
                        key={n.q}
                        className={`py-7 border-b border-border md:pr-10 ${i % 2 === 1 ? "md:pl-10 md:border-l" : ""}`}
                        data-testid={`trust-pillar-${i + 1}`}
                    >
                        <dt className="font-display font-semibold text-lg mb-2">{n.q}</dt>
                        <dd className="text-muted-foreground leading-relaxed">{n.a}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </section>
);
