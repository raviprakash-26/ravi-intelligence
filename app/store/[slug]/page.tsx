"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ShieldCheck, Download, Star, Award, CheckCircle, RefreshCw } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/common/cards";
import { CheckoutDrawer } from "@/components/store/checkout-drawer";
import { products } from "@/content/products";
import { ProductSchema, BreadcrumbsSchema } from "@/components/common/seo";

export default function ProductDetailPage() {
  const params = useParams() as { slug: string };
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const product = products.find((p) => p.slug === params.slug);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-between select-none">
        <div>
          <AnnouncementBar />
          <Navbar />
          <div className="py-20 text-center text-slate-500 font-bold">Product not found.</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Related products
  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 2);

  const mockReviews = [
    {
      author: "Rahul Krishnan",
      role: "Corporate Financial Analyst",
      rating: 5,
      date: "August 2026",
      text: "Absolutely stellar template. The formulas are logical, well-structured, and completely unlocked. Saved me hours of structural layout modeling."
    },
    {
      author: "Meera Nair",
      role: "MBA Finance Student",
      rating: 4,
      date: "July 2026",
      text: "The e-book provides highly practical prompt templates. Used it to automate drafting cash flow explanations in my college reports."
    }
  ];

  const breadcrumbs = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Store", item: "https://ravi-intelligence.com/store" },
    { name: product.title, item: `https://ravi-intelligence.com/store/${product.slug}` }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <ProductSchema
        name={product.title}
        description={product.description}
        image={product.coverImage}
        price={product.price}
        sku={product.id}
        url={`https://ravi-intelligence.com/store/${product.slug}`}
      />
      <BreadcrumbsSchema items={breadcrumbs} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/40 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs text-slate-500 select-none">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/store" className="hover:underline">Store</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>

          {/* Product Overview Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left column: Visuals, features, reviews */}
            <div className="md:col-span-7 space-y-8">
              {/* Product Cover image */}
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-border select-none">
                <img
                  src={product.coverImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bullet Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground select-none">What&apos;s Included</h3>
                <div className="grid grid-cols-1 gap-3">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-card">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-650 dark:text-slate-300 leading-normal">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-4 select-none">
                <h3 className="text-lg font-bold text-foreground">Verified Reviews ({product.reviewsCount})</h3>
                <div className="space-y-4">
                  {mockReviews.map((rev, i) => (
                    <Card key={i} className="p-5 bg-card space-y-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs text-foreground">{rev.author}</h5>
                          <p className="text-[10px] text-slate-500 leading-none">{rev.role}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, r) => (
                              <Star key={r} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">{rev.date}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                        {rev.text}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: Action purchase sidebar */}
            <div className="md:col-span-5 space-y-6">
              <Card className="p-6 space-y-6 bg-card sticky top-24 select-none">
                {/* Meta details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{product.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-550 fill-current" />
                      <span className="text-xs font-bold">{product.rating}</span>
                    </div>
                  </div>
                  <h1 className="text-xl font-extrabold text-foreground leading-snug">
                    {product.title}
                  </h1>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price card details */}
                <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">₹{product.price.toLocaleString("en-IN")}</span>
                    {product.compareAtPrice && (
                      <span className="text-xs line-through text-slate-400">
                        ₹{product.compareAtPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-350">
                    <div className="flex items-center justify-between">
                      <span>File Format:</span>
                      <strong className="text-foreground">{product.fileType}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>File Size:</span>
                      <strong className="text-foreground">{product.fileSize}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button variant="primary" className="w-full font-bold h-12 text-sm" onClick={() => setIsOpenCheckout(true)}>
                    Buy Now
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Instant delivery via secure download</span>
                  </div>
                </div>

                {/* Guarantees */}
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-[11px] text-slate-500">
                    <RefreshCw className="h-4 w-4 text-primary shrink-0" />
                    <span>Free lifetime updates and support on future versions.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-[11px] text-slate-500">
                    <Award className="h-4 w-4 text-primary shrink-0" />
                    <span>Quality certified by Ravi Intelligence analytics faculty.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Related products row */}
          <div className="border-t border-border/40 pt-12 space-y-6">
            <h3 className="text-xl font-extrabold text-foreground select-none">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} onBuy={() => handleBuy(rel)} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Security Checkout drawer */}
      <CheckoutDrawer
        product={product}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <Footer />
    </div>
  );

  function handleBuy(p: typeof product) {
    setIsCheckoutOpen(true);
  }

  function setIsOpenCheckout(open: boolean) {
    setIsCheckoutOpen(open);
  }
}
