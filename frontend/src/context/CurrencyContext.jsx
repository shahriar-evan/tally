import React, { createContext, useContext, useEffect, useState } from "react";
import { CURRENCIES, formatPrice } from "../lib/currency";

const CurrencyContext = createContext({ country: "US", setCountry: () => {}, format: (n) => n });

export const CurrencyProvider = ({ children }) => {
    const [country, setCountry] = useState(() => {
        if (typeof window === "undefined") return "US";
        return localStorage.getItem("tally-country") || "US";
    });

    useEffect(() => {
        localStorage.setItem("tally-country", country);
    }, [country]);

    const value = {
        country,
        setCountry,
        currency: CURRENCIES[country],
        format: (usd) => formatPrice(usd, country),
    };

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => useContext(CurrencyContext);
