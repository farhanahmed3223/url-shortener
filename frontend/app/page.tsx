"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import ShortenForm from "@/components/ShortenForm";
import ResultCard from "@/components/ResultCard";
import { LinkResponse } from "@/lib/api";
import { ArrowRight, Zap, Shield, BarChart2 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant redirects",
    desc: "Redis-cached lookups. Your links load before the cursor blinks.",
  },
  {
    icon: BarChart2,
    title: "Click analytics",
    desc: "Daily breakdown, country data, 30-day charts. Know who clicked.",
  },
  {
    icon: Shield,
    title: "Custom slugs",
    desc: "Own your brand. Set a memorable slug on any link you create.",
  },
];

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [latestLink, setLatestLink] = useState<LinkResponse | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-amber-bright/10 border border-amber-bright/20
                          text-amber-deep text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-bright animate-pulse-dot" />
            Fast, clean, open
          </div>

          <h1 className="font-display text-5xl md:text-6xl leading-tight text-ink mb-6">
            Links that don&rsquo;t
            <br />
            <em>embarrass</em> you.
          </h1>

          <p className="font-body text-slate-subtle text-lg leading-relaxed mb-12 max-w-lg mx-auto">
            Paste a long URL. Get a short one. Track who clicks.
            No fuss, no clutter — just the link.
          </p>

          {/* Form */}
          <ShortenForm onSuccess={setLatestLink} />

          {/* Result */}
          {latestLink && (
            <div className="mt-6">
              <ResultCard link={latestLink} />
            </div>
          )}

          {/* CTA for signed-out */}
          {!isSignedIn && (
            <div className="mt-8 p-5 bg-ink/[0.03] border border-ink/8 rounded-2xl text-left
                            flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink text-sm">Want to manage your links?</p>
                <p className="text-slate-subtle text-sm mt-0.5">
                  Sign in for unlimited links, analytics, and custom slugs.
                </p>
              </div>
              <SignInButton mode="modal">
                <button className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium
                                   text-ink border border-ink/15 rounded-lg px-4 py-2
                                   hover:bg-ink hover:text-cream transition-all active:scale-95">
                  Sign in
                  <ArrowRight size={14} />
                </button>
              </SignInButton>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 bg-white border border-ink/8 rounded-2xl
                           hover:border-amber-bright/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-bright/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-amber-deep" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg text-ink mb-2">{title}</h3>
                <p className="text-sm text-slate-subtle leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/8 py-6 text-center">
        <p className="text-xs text-slate-subtle font-body">
          Built with Next.js, FastAPI, PostgreSQL & Redis
        </p>
      </footer>
    </div>
  );
}
