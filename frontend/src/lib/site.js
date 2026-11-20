// Site-wide settings. Change these in one place when the domain or contact details change.

// Public address of the site, used for canonical links and share previews.
// Set REACT_APP_SITE_URL on Vercel; falls back to whatever domain the page is served from.
export const SITE_URL = (process.env.REACT_APP_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

export const SITE_NAME = "Tally";
export const SITE_TAGLINE = "Every store, one total.";
export const SITE_DESCRIPTION =
    "Tally compares prices for the same product across Amazon, AliExpress, Daraz, Shopee and Lazada, adds delivery, and sorts by the real total.";

// Shown on the Contact, Privacy and Terms pages. Leave empty until you have an address;
// the pages then point people to the contact page instead of showing a blank.
export const CONTACT_EMAIL = "";

export const LEGAL_UPDATED = "21 November 2026";
