"use client";

import * as React from "react";
import { X, CreditCard, ShoppingBag, Lock, CheckCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";

interface CheckoutDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutDrawer({ product, isOpen, onClose }: CheckoutDrawerProps) {
  const [formState, setFormState] = React.useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [status, setStatus] = React.useState<"form" | "loading" | "success">("form");

  React.useEffect(() => {
    if (isOpen) {
      setStatus("form");
      setFormState({ name: "", email: "", cardNumber: "", expiry: "", cvv: "" });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // Simulate payment gateway API response
    setTimeout(() => {
      setStatus("success");
    }, 1800);
  };

  const handleDownload = () => {
    // Simulate ZIP file download
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `${product.slug}-ravi-intelligence.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Mock ZIP product file downloaded successfully!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md bg-card border-l border-border h-full flex flex-col justify-between shadow-2xl overflow-hidden text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/40">
              <div className="flex items-center gap-2 font-bold text-base">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span>Secure Checkout</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {status === "form" && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Product summary */}
                  <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 flex items-center gap-3">
                    <img
                      src={product.coverImage}
                      alt={product.title}
                      className="h-14 w-20 rounded-lg object-cover border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-foreground truncate">{product.title}</h4>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{product.type}</span>
                        <span className="font-extrabold text-sm">₹{product.price.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Billing & Card Details</h3>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Sanjana Iyer"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full h-10 px-3 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="sanjana@example.com"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full h-10 px-3 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Card Number</label>
                      <div className="relative flex items-center">
                        <CreditCard className="absolute left-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4111 2222 3333 4444"
                          value={formState.cardNumber}
                          onChange={(e) => setFormState({ ...formState, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                          className="w-full h-10 pl-10 pr-3 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Expiry Date</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/YY"
                          value={formState.expiry}
                          onChange={(e) => setFormState({ ...formState, expiry: e.target.value })}
                          className="w-full h-10 px-3 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-650 dark:text-slate-350">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="***"
                          value={formState.cvv}
                          onChange={(e) => setFormState({ ...formState, cvv: e.target.value })}
                          className="w-full h-10 px-3 border border-border bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none text-foreground font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-border p-3.5 rounded-lg select-none">
                    <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Your transaction is encrypted. Future payments will utilize Stripe token security.</span>
                  </div>

                  <Button type="submit" variant="primary" className="w-full font-bold h-11 text-xs">
                    Pay ₹{product.price.toLocaleString("en-IN")}
                  </Button>
                </form>
              )}

              {status === "loading" && (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-slate-300 border-t-primary rounded-full animate-spin" />
                  <h3 className="font-bold text-sm text-foreground">Processing Payment</h3>
                  <p className="text-xs text-slate-500">Contacting secure sandbox gateway servers...</p>
                </div>
              )}

              {status === "success" && (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-6">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">Payment Successful!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Thank you for your purchase. Your digital asset is ready for download. We have also sent a confirmation invoice to your email.
                    </p>
                  </div>

                  <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-3 w-full">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Product Name: {product.title}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      className="w-full font-bold h-9 text-xs cursor-pointer"
                    >
                      Download ZIP Product
                      <Download className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/40 bg-slate-50/50 dark:bg-[#090d16] text-[10px] text-center text-slate-500 leading-normal">
              Ravi Intelligence Store Security • Authorized Sandbox Merchant
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
