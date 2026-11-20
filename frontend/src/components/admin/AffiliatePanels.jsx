import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, ExternalLink, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "../ui/dialog";

// Where each program hands out links. Shown next to the fields so the admin knows what to paste.
const PROGRAM_HELP = {
    Amazon: {
        program: "Amazon Associates",
        tracking: "Your Associates tracking ID, e.g. tag=yourname-20. Added to every Amazon link.",
        link: "Optional. Use SiteStripe → Get link on the product page for a direct product link.",
    },
    AliExpress: {
        program: "AliExpress Portals (or a network like Admitad)",
        tracking: "Usually not needed. AliExpress gives a full link per product.",
        link: "Portals → Link generator. Paste the generated product link here.",
    },
    Daraz: {
        program: "Daraz Affiliate Program",
        tracking: "Usually not needed. Daraz gives a full link per product.",
        link: "Affiliate portal → generate a link for the product and paste it here.",
    },
    "Daraz BD": {
        program: "Daraz Affiliate Program",
        tracking: "Usually not needed. Daraz gives a full link per product.",
        link: "Affiliate portal → generate a link for the product and paste it here.",
    },
    Shopee: {
        program: "Shopee Affiliate Program",
        tracking: "Usually not needed. Shopee gives a full link per product.",
        link: "Affiliate dashboard → Custom link. Paste the generated link here.",
    },
    Lazada: {
        program: "Lazada Affiliate Program",
        tracking: "Usually not needed. Lazada gives a full link per product.",
        link: "Affiliate portal → link generator. Paste the generated link here.",
    },
};
const helpFor = (name) => PROGRAM_HELP[name] || {
    program: "the store's affiliate program",
    tracking: "Any key=value parameter the program asks you to add to links.",
    link: "Paste the affiliate link the program gives you for this product.",
};

const StatusPill = ({ earning }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            earning ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
        }`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${earning ? "bg-accent" : "bg-muted-foreground/50"}`} />
        {earning ? "Earning" : "Search link"}
    </span>
);

/* ---------------- Stores ---------------- */

export const StoresPanel = ({ api, stores, onChanged, onDelete }) => {
    const [editing, setEditing] = useState(null);
    return (
        <>
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                    <thead className="bg-secondary/50 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="text-left px-5 py-3">Store</th>
                            <th className="text-left px-5 py-3">Tracking ID</th>
                            <th className="text-left px-5 py-3">Fallback search page</th>
                            <th className="text-right px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map((s) => (
                            <tr key={s.id} className="border-t border-border" data-testid={`store-row-${s.name}`}>
                                <td className="px-5 py-3">
                                    <span className="font-medium">{s.name}</span>
                                    <span className="text-muted-foreground ml-2 text-xs">{s.country} · ★ {s.rating}</span>
                                </td>
                                <td className="px-5 py-3">
                                    {s.tracking_param
                                        ? <code className="font-mono text-xs bg-accent/10 text-accent rounded px-1.5 py-0.5">{s.tracking_param}</code>
                                        : <span className="text-muted-foreground text-xs">Not set</span>}
                                </td>
                                <td className="px-5 py-3 max-w-[280px]">
                                    <span className="font-mono text-xs text-muted-foreground truncate block">{s.search_url || "Default"}</span>
                                </td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)} data-testid={`edit-store-${s.name}`}>
                                        <Pencil className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                    {onDelete && (
                                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onDelete(s)}>
                                            Delete
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <StoreEditDialog
                store={editing}
                api={api}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); onChanged(); }}
            />
        </>
    );
};

const StoreEditDialog = ({ store, api, onClose, onSaved }) => {
    const [tracking, setTracking] = useState("");
    const [searchUrl, setSearchUrl] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (store) {
            setTracking(store.tracking_param || "");
            setSearchUrl(store.search_url || "");
        }
    }, [store]);

    if (!store) return null;
    const help = helpFor(store.name);

    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateStore(store.id, { tracking_param: tracking, search_url: searchUrl });
            toast.success(`${store.name} saved`);
            onSaved();
        } catch (err) {
            const d = err.response?.data?.detail;
            toast.error(Array.isArray(d) ? d[0]?.msg?.replace("Value error, ", "") : d || "Couldn't save the store");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!store} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg" data-testid="edit-store-dialog">
                <DialogHeader>
                    <DialogTitle className="font-display">{store.name} affiliate settings</DialogTitle>
                    <DialogDescription>Program: {help.program}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSave} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="store-tracking">Tracking ID</Label>
                        <Input
                            id="store-tracking"
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                            placeholder="tag=yourname-20"
                            className="font-mono"
                            data-testid="store-tracking-input"
                        />
                        <p className="text-xs text-muted-foreground">{help.tracking}</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="store-search">Fallback search page</Label>
                        <Input
                            id="store-search"
                            value={searchUrl}
                            onChange={(e) => setSearchUrl(e.target.value)}
                            placeholder="https://www.example.com/search?q={q}"
                            className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                            Used for offers that don't have their own affiliate link yet. <code className="font-mono">{"{q}"}</code> is replaced by the product name.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="btn-ink" disabled={saving} data-testid="save-store">
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* ---------------- Offers ---------------- */

const FILTERS = [
    { id: "todo", label: "Needs link" },
    { id: "earning", label: "Earning" },
    { id: "all", label: "All" },
];

export const OffersPanel = ({ api, stores, refreshKey, onChanged }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("todo");
    const [storeFilter, setStoreFilter] = useState("all");
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState(null);

    const load = () => {
        setLoading(true);
        api.listOffers().then(setOffers).catch(() => toast.error("Couldn't load offers")).finally(() => setLoading(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(load, [refreshKey]);

    const earning = offers.filter((o) => o.is_affiliate).length;
    const trackedStores = new Set(stores.filter((s) => s.tracking_param).map((s) => s.id));
    const viaTracking = offers.filter((o) => !o.is_affiliate && trackedStores.has(o.store_id)).length;

    const byStore = useMemo(() => {
        const m = {};
        offers.forEach((o) => {
            m[o.store_name] = m[o.store_name] || { total: 0, earning: 0 };
            m[o.store_name].total += 1;
            if (o.is_affiliate) m[o.store_name].earning += 1;
        });
        return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
    }, [offers]);

    const visible = offers.filter((o) => {
        if (filter === "todo" && o.is_affiliate) return false;
        if (filter === "earning" && !o.is_affiliate) return false;
        if (storeFilter !== "all" && o.store_name !== storeFilter) return false;
        if (q && !o.product_title.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
    });

    const pct = offers.length ? Math.round((earning / offers.length) * 100) : 0;

    return (
        <div className="space-y-5">
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-4">
                <div className="rounded-lg border border-border bg-card p-5" data-testid="affiliate-summary">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Commission coverage</p>
                    <p className="font-display text-3xl font-bold tracking-tight">
                        <span className="font-mono">{earning}</span>
                        <span className="text-muted-foreground text-xl"> / {offers.length} offers</span>
                    </p>
                    <div className="h-1.5 rounded-full bg-secondary mt-3 overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                        Offers with their own affiliate link earn commission.
                        {viaTracking > 0 && <> Another <b className="text-foreground">{viaTracking}</b> search links carry a store tracking ID and can earn too.</>}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">By store</p>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                        {byStore.map(([name, v]) => (
                            <li key={name} className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    className={`truncate text-left hover:underline underline-offset-4 ${storeFilter === name ? "font-semibold" : ""}`}
                                    onClick={() => setStoreFilter(storeFilter === name ? "all" : name)}
                                >
                                    {name}
                                </button>
                                <span className="font-mono text-xs text-muted-foreground">{v.earning}/{v.total}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="tablist" aria-label="Filter offers">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            role="tab"
                            aria-selected={filter === f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 text-sm rounded ${filter === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                            data-testid={`offer-filter-${f.id}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {storeFilter !== "all" && (
                    <button type="button" onClick={() => setStoreFilter("all")} className="text-sm rounded-md border border-border px-2.5 py-1.5 bg-card">
                        {storeFilter} ✕
                    </button>
                )}
                <label className="relative ml-auto w-full sm:w-64">
                    <span className="sr-only">Search offers by product</span>
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9 h-9" />
                </label>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                    <thead className="bg-secondary/50 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="text-left px-5 py-3">Product</th>
                            <th className="text-left px-5 py-3">Store</th>
                            <th className="text-right px-5 py-3">Total</th>
                            <th className="text-left px-5 py-3">Link</th>
                            <th className="text-right px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-10 text-muted-foreground">Loading offers…</td></tr>
                        ) : visible.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-muted-foreground">
                                {filter === "todo" && offers.length > 0 ? "Every offer has an affiliate link." : "No offers match."}
                            </td></tr>
                        ) : visible.map((o) => (
                            <tr key={o.id} className="border-t border-border" data-testid={`offer-admin-row-${o.id}`}>
                                <td className="px-5 py-3 max-w-[280px]">
                                    <span className="font-medium line-clamp-1">{o.product_title}</span>
                                    {!o.in_stock && <span className="text-xs text-primary">Out of stock</span>}
                                </td>
                                <td className="px-5 py-3 whitespace-nowrap">{o.store_name} <span className="text-xs text-muted-foreground">{o.store_country}</span></td>
                                <td className="px-5 py-3 text-right font-mono tabular">${o.total.toFixed(2)}</td>
                                <td className="px-5 py-3"><StatusPill earning={o.is_affiliate} /></td>
                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <a href={o.final_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-secondary text-muted-foreground" aria-label="Open link">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <Button size="sm" variant={o.is_affiliate ? "ghost" : "outline"} onClick={() => setEditing(o)} data-testid={`edit-offer-${o.id}`}>
                                        {o.is_affiliate ? "Edit" : "Add link"}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <OfferEditDialog
                offer={editing}
                api={api}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); load(); onChanged?.(); }}
            />
        </div>
    );
};

const OfferEditDialog = ({ offer, api, onClose, onSaved }) => {
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (offer) {
            setForm({
                affiliate_url: offer.is_affiliate ? offer.affiliate_url : "",
                price: String(offer.price),
                delivery_fee: String(offer.delivery_fee ?? 0),
                in_stock: offer.in_stock !== false,
            });
        }
    }, [offer]);

    if (!offer) return null;
    const help = helpFor(offer.store_name);

    const onSave = async (e) => {
        e.preventDefault();
        const payload = {};
        const newLink = (form.affiliate_url || "").trim();
        const oldLink = offer.is_affiliate ? offer.affiliate_url : "";
        if (newLink !== oldLink) payload.affiliate_url = newLink;
        if (Number(form.price) !== offer.price) payload.price = Number(form.price);
        if (Number(form.delivery_fee) !== (offer.delivery_fee ?? 0)) payload.delivery_fee = Number(form.delivery_fee);
        if (form.in_stock !== (offer.in_stock !== false)) payload.in_stock = form.in_stock;
        if (Object.keys(payload).length === 0) { toast.info("No changes to save"); return; }

        setSaving(true);
        try {
            await api.updateOffer(offer.id, payload);
            toast.success(newLink && payload.affiliate_url !== undefined ? "Affiliate link saved" : "Offer saved");
            onSaved();
        } catch (err) {
            const d = err.response?.data?.detail;
            toast.error(Array.isArray(d) ? d[0]?.msg?.replace("Value error, ", "") : d || "Couldn't save the offer");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!offer} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg" data-testid="edit-offer-dialog">
                <DialogHeader>
                    <DialogTitle className="font-display">{offer.store_name} offer</DialogTitle>
                    <DialogDescription className="line-clamp-2">{offer.product_title}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSave} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="offer-link">Affiliate link</Label>
                        <Input
                            id="offer-link"
                            value={form.affiliate_url || ""}
                            onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                            placeholder="https://…"
                            className="font-mono text-xs"
                            data-testid="offer-link-input"
                        />
                        <p className="text-xs text-muted-foreground">{help.link} Leave empty to send shoppers to {offer.store_name}'s search page instead.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="offer-price">Price (USD)</Label>
                            <Input id="offer-price" type="number" step="0.01" min="0" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value })} className="font-mono" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="offer-delivery">Delivery (USD)</Label>
                            <Input id="offer-delivery" type="number" step="0.01" min="0" value={form.delivery_fee || ""} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} className="font-mono" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                        <Label htmlFor="offer-stock" className="cursor-pointer">In stock</Label>
                        <Switch id="offer-stock" checked={!!form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
                    </div>
                    <div className="rounded-md bg-secondary/60 px-3 py-2.5">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Shoppers currently go to</p>
                        <p className="font-mono text-xs break-all">{offer.final_url}</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="btn-ink" disabled={saving} data-testid="save-offer">
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
