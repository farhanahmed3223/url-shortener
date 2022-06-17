"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import LinkTable from "@/components/LinkTable";
import { api, LinkResponse } from "@/lib/api";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [links, setLinks] = useState<LinkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await api.listLinks(token!, {
        page,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
      });
      setLinks(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, debouncedSearch, sortBy]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy]);

  function handleDelete(code: string) {
    setLinks((prev) => prev.filter((l) => l.short_code !== code));
  }

  const totalClicksShown = links.reduce((sum, l) => sum + (l.click_count || 0), 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl text-ink mb-2">Your links</h1>
            <p className="text-slate-subtle font-body">
              {loading ? "Loading…" : `${links.length} links shown · ${totalClicksShown.toLocaleString()} total clicks`}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-ink/8 rounded-2xl p-6
                        shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-slate-subtle" />
            </div>
          ) : (
            <LinkTable
              links={links}
              onDelete={handleDelete}
              sortBy={sortBy}
              onSortChange={setSortBy}
              search={search}
              onSearchChange={setSearch}
            />
          )}
        </div>

        {/* Pagination */}
        {!loading && links.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-subtle
                         hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors px-3 py-2 rounded-lg hover:bg-ink/5"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-slate-subtle font-mono">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-subtle
                         hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors px-3 py-2 rounded-lg hover:bg-ink/5"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
