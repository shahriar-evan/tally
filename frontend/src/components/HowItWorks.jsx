import React from "react";

const steps = [
    {
        title: "Search once",
        desc: "Type the product. We pull every listing we know of for it, from every store in the network.",
    },
    {
        title: "Shipping goes in",
        desc: "A cheap price with expensive delivery isn't cheap. Each row shows price plus delivery as one total.",
    },
    {
        title: "Cheapest on top",
        desc: "Results are sorted by that total. Tap the store you like and you go straight to its page to buy.",
    },
];

export const HowItWorks = () => (
    <section className="bg-foreground text-background" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
                <div>
                    <span className="font-mono text-xs opacity-60">03</span>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] mt-3 mb-4">
                        How Tally works
                    </h2>
                    <p className="opacity-70 max-w-sm leading-relaxed">
                        No account, no browser extension. It's a search box and an honest, sorted list.
                    </p>
                </div>
                <ol className="grid sm:grid-cols-3 gap-px bg-background/15 rounded-lg overflow-hidden">
                    {steps.map((s, i) => (
                        <li key={s.title} className="bg-foreground p-6 lg:p-7" data-testid={`how-step-${i + 1}`}>
                            <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                            <h3 className="font-display font-semibold text-xl mt-8 mb-2">{s.title}</h3>
                            <p className="text-sm opacity-70 leading-relaxed">{s.desc}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    </section>
);
