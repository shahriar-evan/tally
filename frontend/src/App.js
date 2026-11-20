import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AboutPage, ContactPage, PrivacyPage, TermsPage, AffiliateDisclosurePage } from "./pages/CompanyPages";

function App() {
    return (
        <ThemeProvider>
            <CurrencyProvider>
                <div className="App min-h-screen flex flex-col bg-background text-foreground">
                    <BrowserRouter>
                        <Navbar />
                        <div className="flex-1">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/product/:slug" element={<ProductDetailPage />} />
                                <Route path="/admin" element={<AdminPage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/terms" element={<TermsPage />} />
                                <Route path="/affiliate-disclosure" element={<AffiliateDisclosurePage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </div>
                        <Footer />
                        <Toaster position="top-right" richColors />
                    </BrowserRouter>
                </div>
            </CurrencyProvider>
        </ThemeProvider>
    );
}

export default App;
