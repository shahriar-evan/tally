import { useEffect } from "react";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_TAGLINE } from "../lib/site";

const setMeta = (attr, key, content) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (content == null) {
        el?.remove();
        return;
    }
    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute("content", content);
};

const setLink = (rel, href) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
    }
    el.setAttribute("href", href);
};

const setJsonLd = (data) => {
    const id = "page-jsonld";
    let el = document.getElementById(id);
    if (!data) {
        el?.remove();
        return;
    }
    if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
};

/**
 * Sets the page title, description, canonical URL, share tags and optional JSON-LD.
 * `title` is the page's own name; the site name is appended.
 */
export const useSeo = ({ title, description = SITE_DESCRIPTION, path, image, noindex = false, jsonLd = null, type = "website" } = {}) => {
    useEffect(() => {
        const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
        const url = `${SITE_URL}${path ?? window.location.pathname}`;
        const img = image || `${SITE_URL}/og-image.png`;

        document.title = fullTitle;
        setMeta("name", "description", description);
        setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
        setLink("canonical", url);

        setMeta("property", "og:type", type);
        setMeta("property", "og:site_name", SITE_NAME);
        setMeta("property", "og:title", fullTitle);
        setMeta("property", "og:description", description);
        setMeta("property", "og:url", url);
        setMeta("property", "og:image", img);
        setMeta("name", "twitter:card", "summary_large_image");
        setMeta("name", "twitter:title", fullTitle);
        setMeta("name", "twitter:description", description);
        setMeta("name", "twitter:image", img);

        setJsonLd(jsonLd);
    }, [title, description, path, image, noindex, type, JSON.stringify(jsonLd)]); // eslint-disable-line react-hooks/exhaustive-deps
};
