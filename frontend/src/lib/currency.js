// Static USD-base exchange rates (Feb 2026 approx). All product prices in DB are USD.
export const CURRENCIES = {
    US: { code: "USD", symbol: "$", rate: 1, label: "United States", flag: "🇺🇸" },
    CN: { code: "CNY", symbol: "¥", rate: 7.2, label: "China", flag: "🇨🇳" },
    BD: { code: "BDT", symbol: "৳", rate: 110, label: "Bangladesh", flag: "🇧🇩" },
    PK: { code: "PKR", symbol: "₨", rate: 280, label: "Pakistan", flag: "🇵🇰" },
    SG: { code: "SGD", symbol: "S$", rate: 1.34, label: "Singapore", flag: "🇸🇬" },
    MY: { code: "MYR", symbol: "RM", rate: 4.5, label: "Malaysia", flag: "🇲🇾" },
};

export const formatPrice = (usdAmount, countryCode = "US") => {
    const c = CURRENCIES[countryCode] || CURRENCIES.US;
    const converted = usdAmount * c.rate;
    // For high-rate currencies (BDT, PKR) drop the decimals
    const fractionDigits = c.rate > 50 ? 0 : 2;
    const formatted = converted.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
    return `${c.symbol}${formatted}`;
};
