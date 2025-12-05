"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/my-events", label: "My Events" },
    { href: "/calendar", label: "Calendar" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#1c0333]/30 border-b border-[#ffffff1a] shadow-lg">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-zinc-50"
          >
            Event Planner
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-zinc-50 ${
                  pathname === link.href
                    ? "text-zinc-50"
                    : "text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <span className="text-sm text-zinc-400">
                  {session.user?.name}
                </span>
                <Button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => signIn("google")} size="sm">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
