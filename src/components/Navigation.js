"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import LogoutButton from "./LogoutButton";

export default function Navigation({ onLinkClick, user = null }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const adminRef = useRef(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Klik van dropdown zatvara menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null; // ništa se ne prikazuje ako nije prijavljen

  const navLinks = [
    {
      href: `/dashboard/${currentYear}/${currentMonth}`,
      label: "Почетна",
    },
  ];

  return (
    <>
      {/* Desktop meni */}
      <nav className="hidden md:flex gap-8 text-base items-center tracking-wide">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium"
          >
            {label}
          </Link>
        ))}

        {/* Dropdown za raspored */}
        {user.role !== "gle" && (
          <div ref={adminRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium"
            >
              Распоред ▾
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 bg-white border border-gray-200 rounded-xl shadow-lg w-44 py-2 z-50">
                <Link
                  href={`/schedule/${currentYear}/${currentMonth}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  onClick={(e) => {
                    setIsDropdownOpen(false);
                    onLinkClick?.(e);
                  }}
                >
                  Измени
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 🔹 Promena lozinke */}
        <Link
          href="/change-password"
          className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium"
        >
          Промена лозинке
        </Link>

        {/* Logout u glavnom meniju */}
        <LogoutButton
          className="text-gray-600 hover:text-red-600 transition-colors duration-200 font-medium"
          onClick={onLinkClick}
        />
      </nav>

      {/* Mobilni meni */}
      <div className="md:hidden bg-white shadow-md px-4 py-2 flex flex-col items-start gap-2">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="py-2 text-gray-700 font-medium"
            onClick={onLinkClick}
          >
            {label}
          </Link>
        ))}

        {user.role !== "gle" && (
          <Link
            href={`/schedule/${currentYear}/${currentMonth}`}
            className="py-2 text-gray-700 font-medium"
            onClick={onLinkClick}
          >
            Измени Распоред
          </Link>
        )}

        {/* 🔹 Promena lozinke */}
        <Link
          href="/change-password"
          className="py-2 text-gray-700 font-medium"
          onClick={onLinkClick}
        >
          Промена лозинке
        </Link>

        <LogoutButton
          className="py-2 text-gray-700 font-medium"
          onClick={onLinkClick}
        />
      </div>
    </>
  );
}
