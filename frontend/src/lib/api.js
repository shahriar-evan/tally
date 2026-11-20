import axios from "axios";

// Production builds call the API on the same domain (/api); dev uses REACT_APP_BACKEND_URL.
const BACKEND_URL = process.env.NODE_ENV === "production" ? "" : (process.env.REACT_APP_BACKEND_URL || "");
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const fetchCategories = () => client.get("/categories").then(r => r.data);
export const fetchStores = () => client.get("/stores").then(r => r.data);
export const fetchProducts = (params = {}) => client.get("/products", { params }).then(r => r.data);
export const fetchProduct = (slug) => client.get(`/products/${slug}`).then(r => r.data);
export const trackClick = (offerId) => client.post(`/track-click?offer_id=${offerId}`).then(r => r.data);

export const adminApi = (token) => {
    const c = axios.create({ baseURL: API, headers: { "X-Admin-Token": token } });
    return {
        verify: () => c.get("/admin/verify").then(r => r.data),
        createProduct: (data) => c.post("/admin/products", data).then(r => r.data),
        updateProduct: (id, data) => c.put(`/admin/products/${id}`, data).then(r => r.data),
        patchProduct: (id, data) => c.patch(`/admin/products/${id}`, data).then(r => r.data),
        deleteProduct: (id) => c.delete(`/admin/products/${id}`).then(r => r.data),
        createStore: (data) => c.post("/admin/stores", data).then(r => r.data),
        updateStore: (id, data) => c.patch(`/admin/stores/${id}`, data).then(r => r.data),
        deleteStore: (id) => c.delete(`/admin/stores/${id}`).then(r => r.data),
        createOffer: (data) => c.post("/admin/offers", data).then(r => r.data),
        listOffers: () => c.get("/admin/offers").then(r => r.data),
        updateOffer: (id, data) => c.patch(`/admin/offers/${id}`, data).then(r => r.data),
        deleteOffer: (id) => c.delete(`/admin/offers/${id}`).then(r => r.data),
        getClicks: () => c.get("/admin/clicks").then(r => r.data),
    };
};
