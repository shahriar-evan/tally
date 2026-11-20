# Tally — Product Requirements Document

## Original Problem Statement
Build a complete premium full-stack price comparison web application named Tally.
A global product price comparison platform where users can search any product and see
prices from multiple e-commerce stores sorted from lowest to highest. Users click
"Buy Now" and are redirected via affiliate links.

## User Choices (Feb 2026)
- Authentication: Skipped for MVP
- Admin: Simple env-token-based admin (`ADMIN_TOKEN`)
- Sample data: 5 stores (Amazon, AliExpress, Daraz, Shopee, Lazada) + 10 products
- Theme: Light + dark toggle, blue/purple soft gradient + glassmorphism
- Tech stack: FastAPI + MongoDB + React

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) — Pydantic models (Store, Product, Offer, Click), seed data on startup, REST endpoints under `/api`.
- **Frontend**: React + Tailwind + Shadcn UI, Outfit/Manrope fonts, glass + aurora gradients.
- **DB**: MongoDB collections: `stores`, `products`, `offers`, `clicks`.

## User Personas
- **Smart Shopper** — searches a product, scans the price-comparison table, clicks Buy Now from the lowest store.
- **Admin** — logs in at `/admin` with token, manages products/stores/offers and views click logs.

## Core Requirements
1. Hero with search (q + category + country) → /search
2. 4 image-based premium category cards (Fashion, Electronics, Accessories, Digital)
3. Trending products grid (lowest total badge, rating, store count)
4. How-it-works (3 steps) + Trust section (3 pillars) + Footer
5. Search page with sidebar filters (country, category, store, price range) + sort (lowest/rating)
6. Product detail: image + lowest price highlight + comparison table (Store/Price/Delivery/Total/Buy, lowest row highlighted) + related products
7. Buy Now: tracked via POST /api/track-click → redirects to affiliate URL
8. Simple Admin panel with token login (Products/Stores/Offers/Clicks tabs)

## Implemented (2026-02)
- All REST endpoints (categories, stores, products with filters/sort, product detail with offers + related, track-click, redirect, admin CRUD, admin clicks)
- Auto-seeded 5 stores + 10 products + offers on first startup
- Premium homepage with hero, category cards, trending grid, how-it-works, trust, footer
- Search page with sidebar + mobile filter drawer
- Product detail with comparison table + related products
- Admin panel (login, CRUD for products/stores/offers, click logs)
- Light/dark theme toggle persisted in localStorage
- Verified 100% backend + 100% frontend by testing agent

## Prioritized Backlog
### P1
- Make seed offer prices deterministic for stable demos
- Allow partial PATCH updates on admin products
- Product edit form in admin (currently delete-only via UI)

### P2
- User auth + saved favourites / price alerts (email when a product drops)
- Real-time price updates via scheduled jobs
- Multi-currency conversion based on country selector
- Public click analytics dashboard

### P3
- Native mobile apps
- Browser extension for instant comparison on retailer pages
