"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navigation from "./Navigation";

export default function Header({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href={`/dashboard/${currentYear}/${currentMonth}`}
          className="flex items-center gap-2"
        >
          <Image src="/logo.png" alt="ТИС лого" width={40} height={40} />

          <span className="text-lg sm:text-xl md:text-2xl text-blue-800 font-light tracking-wide">
            Евиденција
          </span>
        </Link>

        <div className="hidden md:block">
          <Navigation user={user} />
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
          ☰
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden px-4 pb-4">
          <Navigation user={user} />
        </div>
      )}
    </header>
  );
}
