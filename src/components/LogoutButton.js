"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function LogoutButton({ className = "", onClick }) {
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const handleLogout = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Грешка при одјави");
      }

      onClick?.();
      window.location.replace("/login");
    } catch (err) {
      toast.error(err.message || "Грешка при одјави", { id: "logout" });
      submitting.current = false;
      setLoading(false);
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
