import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "../components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, ShieldCheck, LogOut, Pencil } from "lucide-react";
import { adminApi, fetchProducts, fetchStores } from "../lib/api";

export default function AdminPage() {
    const [token, setToken] = useState(() => localStorage.getItem("tally-admin") || "");
    const [authed, setAuthed] = useState(false);
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [clicks, setClicks] = useState([]);
    const [editing, setEditing] = useState(null);

    const api = adminApi(token);

    const refresh = async () => {
        const [p, s] = await Promise.all([fetchProducts({ limit: 100 }), fetchStores()]);
        setProducts(p); setStores(s);
        try { setClicks(await api.getClicks()); } catch { /* ignore */ }
    };

    const tryLogin = async (t) => {
        try {
            await adminApi(t).verify();
            setToken(t);
            localStorage.setItem("tally-admin", t);
            setAuthed(true);
            toast.success("Welcome back, admin");
            return true;
        } catch {
            toast.error("Invalid admin token");
            return false;
        }
    };

    useEffect(() => {
        if (token) tryLogin(token).then(ok => ok && refresh());
        // eslint-disable-next-line
    }, []);

    useEffect(() => { if (authed) refresh(); /* eslint-disable-next-line */ }, [authed]);

    if (!authed) {
        return (
            <main className="min-h-[80vh] flex items-center justify-center bg-aurora px-4" data-testid="admin-login-page">
                <div className="glass-strong rounded-3xl p-8 sm:p-10 w-full max-w-md">
                    <div className="w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center mb-5">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-display text-2xl font-bold mb-2">Admin access</h1>
                    <p className="text-sm text-muted-foreground mb-6">Enter your admin token to manage Tally.</p>
                    <form onSubmit={(e) => { e.preventDefault(); tryLogin(token); }} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Admin token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="rounded-2xl h-12"
                            data-testid="admin-token-input"
                        />
                        <Button type="submit" className="btn-gradient rounded-2xl h-12 w-full" data-testid="admin-login-button">
                            Sign in
                        </Button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="admin-dashboard">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground">Manage products, stores, offers and view clicks.</p>
                </div>
                <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => { localStorage.removeItem("tally-admin"); setAuthed(false); setToken(""); }}
                    data-testid="admin-logout"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
            </div>

            <Tabs defaultValue="products">
                <TabsList className="rounded-full">
                    <TabsTrigger value="products" data-testid="tab-products">Products ({products.length})</TabsTrigger>
                    <TabsTrigger value="stores" data-testid="tab-stores">Stores ({stores.length})</TabsTrigger>
                    <TabsTrigger value="offers" data-testid="tab-offers">Offers</TabsTrigger>
                    <TabsTrigger value="clicks" data-testid="tab-clicks">Clicks ({clicks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6 space-y-6">
                    <ProductForm api={api} onCreated={refresh} />
                    <div className="glass rounded-3xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40 text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="text-left px-5 py-3">Title</th>
                                    <th className="text-left px-5 py-3">Slug</th>
                                    <th className="text-left px-5 py-3">Category</th>
                                    <th className="text-left px-5 py-3">Stores</th>
                                    <th className="text-right px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="border-t border-border" data-testid={`admin-product-row-${p.slug}`}>
                                        <td className="px-5 py-3 font-medium">{p.title}</td>
                                        <td className="px-5 py-3 text-muted-foreground">{p.slug}</td>
                                        <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{p.category}</span></td>
                                        <td className="px-5 py-3">{p.store_count}</td>
                                        <td className="px-5 py-3 text-right space-x-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditing(p)}
                                                data-testid={`edit-product-${p.slug}`}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => { await api.deleteProduct(p.id); toast.success("Deleted"); refresh(); }}
                                                data-testid={`delete-product-${p.slug}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="stores" className="mt-6 space-y-6">
                    <StoreForm api={api} onCreated={refresh} />
                    <div className="glass rounded-3xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40 text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="text-left px-5 py-3">Name</th>
                                    <th className="text-left px-5 py-3">Country</th>
                                    <th className="text-left px-5 py-3">Rating</th>
                                    <th className="text-right px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map(s => (
                                    <tr key={s.id} className="border-t border-border">
                                        <td className="px-5 py-3 font-medium">{s.name}</td>
                                        <td className="px-5 py-3">{s.country}</td>
                                        <td className="px-5 py-3">{s.rating}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => { await api.deleteStore(s.id); toast.success("Deleted"); refresh(); }}
                                            ><Trash2 className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="offers" className="mt-6 space-y-6">
                    <OfferForm api={api} stores={stores} products={products} onCreated={refresh} />
                </TabsContent>

                <TabsContent value="clicks" className="mt-6">
                    <div className="glass rounded-3xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40 text-xs uppercase tracking-widest">
                                <tr>
                                    <th className="text-left px-5 py-3">Product</th>
                                    <th className="text-left px-5 py-3">Store</th>
                                    <th className="text-left px-5 py-3">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clicks.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-muted-foreground">No clicks tracked yet.</td></tr>
                                ) : clicks.map(c => (
                                    <tr key={c.id} className="border-t border-border">
                                        <td className="px-5 py-3">{c.product_title}</td>
                                        <td className="px-5 py-3">{c.store_name}</td>
                                        <td className="px-5 py-3 text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>

            <ProductEditDialog
                product={editing}
                api={api}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); refresh(); }}
            />
        </main>
    );
}

const ProductEditDialog = ({ product, api, onClose, onSaved }) => {
    const [form, setForm] = useState({});
    const [original, setOriginal] = useState({});

    useEffect(() => {
        if (product) {
            const initial = {
                title: product.title || "",
                slug: product.slug || "",
                category: product.category || "electronics",
                description: product.description || "",
                images: (product.images || []).join(", "),
                rating: product.rating ?? 4.5,
                review_count: product.review_count ?? 0,
                trending: !!product.trending,
            };
            setForm(initial);
            setOriginal(initial);
        }
    }, [product]);

    if (!product) return null;

    const onSave = async (e) => {
        e.preventDefault();
        const payload = {};
        if (form.title !== original.title) payload.title = form.title;
        if (form.slug !== original.slug) payload.slug = form.slug;
        if (form.category !== original.category) payload.category = form.category;
        if (form.description !== original.description) payload.description = form.description;
        if (form.images !== original.images) {
            payload.images = form.images.split(",").map(s => s.trim()).filter(Boolean);
        }
        if (Number(form.rating) !== Number(original.rating)) payload.rating = Number(form.rating);
        if (Number(form.review_count) !== Number(original.review_count)) payload.review_count = Number(form.review_count);
        if (form.trending !== original.trending) payload.trending = form.trending;

        if (Object.keys(payload).length === 0) {
            toast.info("No changes to save");
            return;
        }

        try {
            await api.patchProduct(product.id, payload);
            toast.success("Product updated");
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Update failed");
        }
    };

    return (
        <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl rounded-3xl" data-testid="edit-product-dialog">
                <DialogHeader>
                    <DialogTitle className="font-display">Edit product</DialogTitle>
                    <DialogDescription>Update any field — only changed values are sent (partial PATCH).</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSave} className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Title</Label><Input value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} data-testid="edit-product-title" /></div>
                    <div><Label>Slug</Label><Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value })} data-testid="edit-product-slug" /></div>
                    <div>
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                            <SelectTrigger data-testid="edit-product-category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="electronics">Electronics</SelectItem>
                                <SelectItem value="fashion">Fashion</SelectItem>
                                <SelectItem value="accessories">Accessories</SelectItem>
                                <SelectItem value="digital">Digital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div><Label>Rating</Label><Input type="number" step="0.1" value={form.rating ?? ""} onChange={e => setForm({ ...form, rating: e.target.value })} data-testid="edit-product-rating" /></div>
                    <div className="sm:col-span-2"><Label>Images (comma separated URLs)</Label><Input value={form.images || ""} onChange={e => setForm({ ...form, images: e.target.value })} /></div>
                    <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div><Label>Review count</Label><Input type="number" value={form.review_count ?? ""} onChange={e => setForm({ ...form, review_count: e.target.value })} /></div>
                    <div className="flex items-center justify-between pt-6">
                        <Label className="cursor-pointer">Trending</Label>
                        <Switch checked={!!form.trending} onCheckedChange={(v) => setForm({ ...form, trending: v })} data-testid="edit-product-trending" />
                    </div>
                    <DialogFooter className="sm:col-span-2">
                        <Button type="button" variant="outline" className="rounded-full" onClick={onClose} data-testid="cancel-product-edit">Cancel</Button>
                        <Button type="submit" className="btn-gradient rounded-full" data-testid="save-product-edit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ProductForm = ({ api, onCreated }) => {
    const [form, setForm] = useState({ title: "", slug: "", category: "electronics", description: "", images: "", rating: 4.5, review_count: 0, trending: false });
    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createProduct({
                ...form,
                images: form.images.split(",").map(s => s.trim()).filter(Boolean),
                rating: Number(form.rating),
                review_count: Number(form.review_count),
            });
            toast.success("Product created");
            setForm({ title: "", slug: "", category: "electronics", description: "", images: "", rating: 4.5, review_count: 0, trending: false });
            onCreated();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed");
        }
    };
    return (
        <form onSubmit={onSubmit} className="glass rounded-3xl p-6 grid sm:grid-cols-2 gap-4" data-testid="product-form">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required data-testid="product-title-input" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required data-testid="product-slug-input" /></div>
            <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div><Label>Images (comma separated URLs)</Label><Input value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" className="btn-gradient rounded-full" data-testid="create-product-button"><Plus className="w-4 h-4 mr-1" /> Add product</Button>
            </div>
        </form>
    );
};

const StoreForm = ({ api, onCreated }) => {
    const [form, setForm] = useState({ name: "", country: "US", rating: 4.5, affiliate_base: "", logo: "" });
    const onSubmit = async (e) => {
        e.preventDefault();
        await api.createStore({ ...form, rating: Number(form.rating) });
        toast.success("Store created");
        setForm({ name: "", country: "US", rating: 4.5, affiliate_base: "", logo: "" });
        onCreated();
    };
    return (
        <form onSubmit={onSubmit} className="glass rounded-3xl p-6 grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} required /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} /></div>
            <div><Label>Affiliate base URL</Label><Input value={form.affiliate_base} onChange={e => setForm({ ...form, affiliate_base: e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" className="btn-gradient rounded-full"><Plus className="w-4 h-4 mr-1" /> Add store</Button>
            </div>
        </form>
    );
};

const OfferForm = ({ api, stores, products, onCreated }) => {
    const [form, setForm] = useState({ product_id: "", store_id: "", price: "", delivery_fee: "0", affiliate_url: "" });
    const onSubmit = async (e) => {
        e.preventDefault();
        await api.createOffer({
            ...form,
            price: Number(form.price),
            delivery_fee: Number(form.delivery_fee),
        });
        toast.success("Offer created");
        setForm({ product_id: "", store_id: "", price: "", delivery_fee: "0", affiliate_url: "" });
        onCreated();
    };
    return (
        <form onSubmit={onSubmit} className="glass rounded-3xl p-6 grid sm:grid-cols-2 gap-4" data-testid="offer-form">
            <div>
                <Label>Product</Label>
                <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label>Store</Label>
                <Select value={form.store_id} onValueChange={v => setForm({ ...form, store_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>
                        {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
            <div><Label>Delivery fee</Label><Input type="number" step="0.01" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Affiliate URL</Label><Input value={form.affiliate_url} onChange={e => setForm({ ...form, affiliate_url: e.target.value })} required /></div>
            <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" className="btn-gradient rounded-full"><Plus className="w-4 h-4 mr-1" /> Add offer</Button>
            </div>
        </form>
    );
};
