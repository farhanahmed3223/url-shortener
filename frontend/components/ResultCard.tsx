"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { LinkResponse } from "@/lib/api";

interface Props {
  link: LinkResponse;
}

export default function ResultCard({ link }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full bg-ink rounded-2xl p-6 animate-slide-up
                    shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
      <div className="flex items-start gap-6">
        {/* QR Code */}
        <div className="flex-shrink-0 bg-white rounded-xl p-3">
          <QRCodeSVG
            value={link.short_url}
            size={80}
            fgColor="#0D0D0D"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>

        {/* Link details */}
        <div className="flex-1 min-w-0">
          <p className="text-cream/40 text-xs font-body uppercase tracking-wider mb-1">
            Your short link
          </p>

          <div className="flex items-center gap-2 mb-3">
            <a
              href={link.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-bright font-mono text-lg font-medium
                         hover:text-amber-deep transition-colors duration-150 truncate"
            >
              {link.short_url.replace(/^https?:\/\//, "")}
            </a>
            <ExternalLink size={14} className="text-amber-bright/60 flex-shrink-0" />
          </div>

          <p className="text-cream/40 text-xs font-body truncate mb-4">
            → {link.original_url}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-cream/10 hover:bg-cream/20
                         text-cream px-4 py-2 rounded-lg text-sm font-medium
                         transition-all duration-150 active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
