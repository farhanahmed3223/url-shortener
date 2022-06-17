"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, LinkResponse, ApiError } from "@/lib/api";
import {
  ExternalLink, BarChart2, Trash2, Copy, Check,
  ChevronUp, ChevronDown, Search
} from "lucide-react";

interface Props {
  links: LinkResponse[];
  onDelete?: (code: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LinkTable({
  links,
  onDelete,
  sortBy,
  onSortChange,
  search,
  onSearchChange,
}: Props) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  async function handleCopy(url: string, code: string) {
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function handleDelete(code: string) {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    setDeletingCode(code);
    try {
      const token = await getToken();
      await api.deleteLink(code, token!);
      onDelete?.(code);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeletingCode(null);
    }
  }

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => onSortChange(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider
                 text-slate-subtle hover:text-ink transition-colors duration-150"
    >
      {label}
      {sortBy === field ? (
        <ChevronDown size={12} />
      ) : (
        <ChevronUp size={12} className="opacity-30" />
      )}
    </button>
  );

  return (
    <div>
      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-subtle" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by original URL…"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/10 rounded-xl
                     text-sm font-body text-ink placeholder:text-slate-subtle/50
                     focus:outline-none focus:border-amber-bright transition-colors"
        />
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 text-slate-subtle font-body">
          <p className="text-4xl mb-3">🔗</p>
          <p className="font-medium">No links yet</p>
          <p className="text-sm mt-1 opacity-70">Shorten your first URL to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/8">
                <th className="text-left pb-3 pr-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-subtle">
                    Short URL
                  </span>
                </th>
                <th className="text-left pb-3 pr-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-subtle">
                    Original URL
                  </span>
                </th>
                <th className="text-left pb-3 pr-4">
                  <SortButton field="clicks" label="Clicks" />
                </th>
                <th className="text-left pb-3 pr-4">
                  <SortButton field="created_at" label="Created" />
                </th>
                <th className="text-left pb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-subtle">
                    Expires
                  </span>
                </th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.short_code}
                  className="border-b border-ink/5 hover:bg-ink/[0.02] transition-colors"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={link.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-amber-deep hover:text-amber-bright
                                   transition-colors flex items-center gap-1"
                      >
                        {link.short_code}
                        <ExternalLink size={11} />
                      </a>
                      <button
                        onClick={() => handleCopy(link.short_url, link.short_code)}
                        className="text-slate-subtle hover:text-ink transition-colors"
                        title="Copy"
                      >
                        {copiedCode === link.short_code ? (
                          <Check size={13} className="text-green-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 pr-4 max-w-xs">
                    <span className="text-sm text-slate-subtle font-body" title={link.original_url}>
                      {truncate(link.original_url, 45)}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-sm font-medium text-ink">
                      {link.click_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-sm text-slate-subtle">{formatDate(link.created_at)}</span>
                  </td>
                  <td className="py-4 pr-4">
                    {link.expires_at ? (
                      <span className="text-sm text-slate-subtle">{formatDate(link.expires_at)}</span>
                    ) : (
                      <span className="text-sm text-slate-subtle/40">Never</span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stats/${link.short_code}`}
                        className="p-1.5 rounded-lg hover:bg-ink/5 text-slate-subtle
                                   hover:text-ink transition-colors"
                        title="View stats"
                      >
                        <BarChart2 size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(link.short_code)}
                        disabled={deletingCode === link.short_code}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-subtle
                                   hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
