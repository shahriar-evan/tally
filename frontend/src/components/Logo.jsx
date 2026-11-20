import React from "react";

// Tally mark: four strokes counted, the fifth crosses them out — every store counted, the best one picked.
export const LogoMark = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-foreground" />
        <g className="stroke-background" strokeWidth="2.4" strokeLinecap="round">
            <path d="M10 9.5v13" />
            <path d="M14 9.5v13" />
            <path d="M18 9.5v13" />
            <path d="M22 9.5v13" />
        </g>
        <path d="M7 20.5 25 11.5" stroke="#E5482F" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
);

export const Logo = ({ className = "" }) => (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <LogoMark />
        <span className="font-display font-bold text-[22px] tracking-[-0.03em] leading-none">
            tally<span className="text-primary">.</span>
        </span>
    </span>
);
