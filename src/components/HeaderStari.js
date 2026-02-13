"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* <h1 className="text-2xl font-bold text-pink-600">YogaLife</h1> */}
        {/* LOGO + NASLOV */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.png" // stavi tvoju sliku ovde, npr. logo u public/logo.png
            alt="Lotus Logo"
            width={40}
            height={40}
          />
          <span className="text-2xl font-bold text-pink-600">YogaLife</span>
        </Link>

        <nav className="hidden md:flex gap-6 text-lg">
          <Link href="/">Početna</Link>
          <Link href="/about">O meni</Link>
          <Link href="/blog">Blog</Link>
        </nav>
        {/* Mobilni meni dugme */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      {/* Padajući mobilni meni */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md px-4 py-2 flex flex-col items-start">
          <Link href="/" className="py-2" onClick={() => setIsOpen(false)}>
            Početna
          </Link>
          <Link href="/about" className="py-2" onClick={() => setIsOpen(false)}>
            O meni
          </Link>
          <Link href="/blog" className="py-2" onClick={() => setIsOpen(false)}>
            Blog
          </Link>
        </div>
      )}
    </header>
  );
}
