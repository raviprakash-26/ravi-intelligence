"use client";

import * as React from "react";
import { ShoppingBag, Search, Sparkles } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { ProductCard } from "@/components/common/cards";
import { CheckoutDrawer } from "@/components/store/checkout-drawer";
import { products } from "@/content/products";
import { Product } from "@/types";

export default function StoreFrontPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("All");
  const [sortBy, setSortBy] = React.useState<"rating" | "price-asc" | "price-desc">("rating");
  const [checkoutProduct, setCheckoutProduct] = React.useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const productTypes = ["All", "Template", "Ebook", "ZIP Bundle"];

  const filteredProducts = React.useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === "All" || p.type === selectedType;

      return matchesSearch && matchesType;
    });

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0;
    });
  }, [searchQuery, selectedType, sortBy]);

  const handleBuy = (product: Product) => {
    setCheckoutProduct(product);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 select-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Digital Storefront</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Premium Spreadsheets, Dashboards, & E-books
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Equip yourself with professional Excel financial models, Power BI executive layout canvases, advanced prompt engineering handbooks, and databases.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-5 max-w-5xl mx-auto select-none">
            {/* Filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {productTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                    selectedType === type
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-slate-650 dark:text-slate-400 border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {type === "All" ? "All Products" : `${type}s`}
                </button>
              ))}
            </div>

            {/* Right actions: search & sort */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Sort Selection */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 px-3 bg-card border border-border rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto cursor-pointer"
              >
                <option value="rating">Sort by: Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              {/* Search box */}
              <div className="relative w-full sm:max-w-xs shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Catalog grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground">No Products Found</h3>
              <p className="text-xs text-slate-500">Modify your keyword filters or clear search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} onBuy={handleBuy} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Security Billing Checkout Drawer Overlay */}
      <CheckoutDrawer
        product={checkoutProduct}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <Footer />
    </div>
  );
}
