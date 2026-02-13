"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navigation from "./Navigation";
import { useUser } from "@/lib/useUser";
// import { getCurrentUserWithRole } from "@/lib/data-service";

// const mockUser = {
//   name: "Marija",
// };
// const mockUser = null;

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useUser();
  const handleLinkClick = () => setIsOpen(false);
  // const { user } = getCurrentUserWithRole();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // jer je 0-based

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href={`/dashboard/${currentYear}/${currentMonth}`}
          className="flex items-center space-x-2"
        >
          <Image src="/logo.png" alt="ТИС лого" width={40} height={40} />
          <span className="text-xl md:text-2xl text-blue-800  font-light tracking-wide">
            Евиденција
          </span>
        </Link>

        <div className="hidden md:block">
          {!loading && <Navigation user={user} />}
        </div>

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

      {isOpen && !loading && (
        <Navigation onLinkClick={handleLinkClick} user={user} />
      )}
    </header>
  );
}
