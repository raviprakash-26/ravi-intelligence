"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, KeyRound, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Simulate authentication checks
    setTimeout(() => {
      if (username === "admin" && password === "ravi-intelligence-admin-2026") {
        localStorage.setItem("ravi-intelligence-admin-session", "active");
        router.push("/admin");
      } else {
        setErrorMsg("Invalid administrative credentials.");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 select-none">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-10 -left-10 h-32 w-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl" />

        <CardContent className="p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="h-11 w-11 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mx-auto text-blue-500">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-zinc-100 uppercase tracking-widest leading-none">Admin Portal</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ravi Intelligence CMS</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2.5 text-[11px] text-red-400">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.2" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5 leading-none mb-1.5">
                <User className="h-3.5 w-3.5" /> Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-9.5 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5 leading-none mb-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9.5 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg shadow-blue-500/10 transition-all select-none"
            >
              {loading ? "Authenticating..." : "Authorize Login"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
