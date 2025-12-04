"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Event Planner
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        {/* Links */}
       <Button variant={"outline"}>
            <Link href="/login">Login</Link>
       </Button>

      </nav>
    </header>
  );
}
