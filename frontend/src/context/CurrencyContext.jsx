import React, { createContext, useContext, useEffect, useState } from "react";
import { CURRENCIES, formatPrice } from "../lib/currency";
import { API } from "../lib/api";

const CurrencyContext = createContext({ country: "US", setCountry: () => {}, format: (n) => n });

// Saved only when the visitor picks a currency themselves. An old auto-saved
// value (the previous "tally-country" key) is ignored so detection can run.
const CHOICE_KEY = "tally-currency-choice";

const TIMEZONE_COUNTRY = {
    "Asia/Dhaka": "BD",
    "Asia/Karachi": "PK",
    "Asia/Singapore": "SG",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Kuching": "MY",
    "Asia/Shanghai": "CN",
    "Asia/Chongqing": "CN",
    "Asia/Harbin": "CN",
    "Asia/Urumqi": "CN",
};

const supported = (code) => (code && CURRENCIES[code.toUpperCase()] ? code.toUpperCase() : null);

const readChoice = () => {
    try { return supported(localStorage.getItem(CHOICE_KEY)); } catch { return null; }
};

// Best guess without a network call. Timezone comes first: "en-US" is the
// default language for English speakers everywhere, so its region says little.
const guessFromBrowser = () => {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];
        if (tz?.startsWith("America/") || tz?.startsWith("US/")) return "US";
    } catch { /* ignore */ }
    try {
        const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
        for (const l of langs) {
            const region = l?.split("-")[1];
            if (region && region.toUpperCase() !== "US" && supported(region)) return supported(region);
        }
    } catch { /* ignore */ }
    return null;
};

export const CurrencyProvider = ({ children }) => {
    const [choice] = useState(readChoice);
    const [country, setCountryState] = useState(() => choice || guessFromBrowser() || "US");
    const [source, setSource] = useState(choice ? "choice" : "browser");

    // No saved choice: ask the API which country the visitor is in (set by the host from their IP).
    useEffect(() => {
        if (choice) return;
        let cancelled = false;
        fetch(`${API}/geo`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (cancelled || !d?.country) return;
                setCountryState(supported(d.country) || "US");
                setSource("location");
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [choice]);

    // A manual pick wins from now on.
    const setCountry = (code) => {
        setCountryState(code);
        setSource("choice");
        try { localStorage.setItem(CHOICE_KEY, code); } catch { /* ignore */ }
    };

    const value = {
        country,
        setCountry,
        source,
        currency: CURRENCIES[country],
        format: (usd) => formatPrice(usd, country),
    };

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
