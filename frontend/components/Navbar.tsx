"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/8 bg-cream/80 backdrop-blur-sm">
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl text-ink hover:text-amber-deep transition-colors"
        >
          Snip
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors
                  ${pathname === "/dashboard" ? "text-ink" : "text-slate-subtle hover:text-ink"}`}
              >
                <LayoutDashboard size={15} strokeWidth={1.5} />
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-slate-subtle hover:text-ink transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium bg-ink text-cream px-4 py-2 rounded-lg
                                   hover:bg-ink-soft transition-colors active:scale-95">
                  Sign up free
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
