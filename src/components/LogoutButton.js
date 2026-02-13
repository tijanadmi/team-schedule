"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "", onClick }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Грешка при одјави");
        return;
      }

      onClick?.();
      router.push("/login");
    } catch (err) {
      console.error("Грешка при одјави:", err);
    } finally {
      setLoading(false);
      onClick?.();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 ${className}`}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
          <span>Одјава...</span>
        </>
      ) : (
        "Одјави се"
      )}
    </button>
  );
}
