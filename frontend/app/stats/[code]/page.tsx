"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StatsChart from "@/components/StatsChart";
import { api, StatsResponse } from "@/lib/api";
import {
  ArrowLeft, Copy, Check, Trash2, MousePointerClick,
  CalendarDays, TrendingUp, Loader2
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-ink/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-slate-subtle text-sm mb-3">
        <Icon size={15} strokeWidth={1.5} />
        {label}
      </div>
      <p className="font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

export default function StatsPage({ params }: { params: { code: string } }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const { code } = params;

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const shortUrl = `${API_URL}/r/${code}`;

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const data = await api.getStats(code, token!);
        setStats(data);
      } catch {
        setError("Could not load stats. You may not own this link.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code, getToken]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm("Delete this link permanently?")) return;
    setDeleting(true);
    try {
      const token = await getToken();
      await api.deleteLink(code, token!);
      router.push("/dashboard");
    } catch {
      alert("Failed to delete link");
      setDeleting(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-subtle
                     hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-slate-subtle" />
          </div>
        ) : error ? (
          <div className="text-center py-32 text-slate-subtle">
            <p className="text-4xl mb-3">🔒</p>
            <p>{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-4xl text-ink mb-1">/{code}</h1>
                <a
                  href={stats.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-subtle hover:text-ink transition-colors truncate block max-w-md"
                >
                  {stats.original_url}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm font-medium
                             border border-ink/15 rounded-lg px-4 py-2
                             hover:bg-ink hover:text-cream hover:border-ink
                             transition-all active:scale-95"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 text-sm font-medium
                             text-red-500 border border-red-200 rounded-lg px-4 py-2
                             hover:bg-red-50 transition-all active:scale-95
                             disabled:opacity-40"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={MousePointerClick}
                label="Total clicks"
                value={stats.total_clicks.toLocaleString()}
              />
              <StatCard
                icon={TrendingUp}
                label="Clicks today"
                value={stats.clicks_today.toLocaleString()}
              />
              <StatCard
                icon={CalendarDays}
                label="Created"
                value={formatDate(stats.created_at)}
              />
            </div>

            {/* Chart */}
            <div className="bg-white border border-ink/8 rounded-2xl p-6
                            shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <h2 className="font-display text-xl text-ink mb-6">
                Clicks — last 30 days
              </h2>
              <StatsChart data={stats.daily_stats} />
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
