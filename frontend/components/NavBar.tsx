"use client";
import React from "react";
import Link from "next/link";

export default function NavBar() {
  return (
    <header className="w-full border-b bg-white/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Community Workshops</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/" className="text-sm hover:underline">
            Home
          </Link>
          <Link href="/community" className="text-sm hover:underline">
            Community
          </Link>
          <Link href="/about" className="text-sm hover:underline">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
