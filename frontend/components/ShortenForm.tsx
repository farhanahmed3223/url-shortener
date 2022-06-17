"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api, LinkResponse, ApiError } from "@/lib/api";
import { Link2, ChevronDown, Loader2 } from "lucide-react";

interface Props {
  onSuccess: (link: LinkResponse) => void;
}

export default function ShortenForm({ onSuccess }: Props) {
  const { getToken, isSignedIn } = useAuth();
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [showCustomSlug, setShowCustomSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = isSignedIn ? await getToken() : undefined;
      const payload = {
        url: url.trim(),
        ...(customSlug.trim() ? { custom_slug: customSlug.trim() } : {}),
      };
      const link = await api.createLink(payload, token ?? undefined);
      onSuccess(link);
      setUrl("");
      setCustomSlug("");
      setShowCustomSlug(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* URL Input */}
        <div className="flex items-center gap-3 p-1.5 bg-white border-2 border-ink/10 rounded-2xl
                        shadow-[0_4px_24px_rgba(0,0,0,0.06)] focus-within:border-amber-bright
                        transition-colors duration-200">
          <Link2
            size={20}
            className="ml-3 text-slate-subtle flex-shrink-0"
            strokeWidth={1.5}
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a long URL here…"
            required
            className="flex-1 bg-transparent py-3 pr-2 text-ink placeholder:text-slate-subtle/60
                       font-body text-base focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 bg-ink text-cream px-6 py-3 rounded-xl
                       font-body font-medium text-sm
                       hover:bg-ink-soft active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150 flex-shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Shorten
          </button>
        </div>

        {/* Custom slug toggle */}
        {isSignedIn && (
          <button
            type="button"
            onClick={() => setShowCustomSlug(!showCustomSlug)}
            className="mt-3 flex items-center gap-1.5 text-sm text-slate-subtle
                       hover:text-ink transition-colors duration-150 ml-1"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showCustomSlug ? "rotate-180" : ""}`}
            />
            Custom slug
          </button>
        )}

        {/* Custom slug input */}
        {showCustomSlug && isSignedIn && (
          <div className="mt-2 animate-slide-up">
            <div className="flex items-center gap-2 bg-white border border-ink/10 rounded-xl px-4 py-3">
              <span className="text-slate-subtle text-sm font-mono">snip.app/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                placeholder="my-custom-slug"
                maxLength={20}
                className="flex-1 bg-transparent text-ink text-sm font-mono focus:outline-none
                           placeholder:text-slate-subtle/40"
              />
            </div>
            <p className="mt-1 ml-1 text-xs text-slate-subtle">
              3–20 chars, letters, numbers, hyphens only
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 animate-fade-in ml-1">{error}</p>
      )}
    </form>
  );
}
