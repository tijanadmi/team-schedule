"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY,
);

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("Лозинка је обавезна.");
      return;
    }

    if (password.length < 6) {
      toast.error("Лозинка мора имати најмање 6 карактера.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Лозинке се не поклапају.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // 🔐 ODMAH IZLOGUJ KORISNIKA
      // await supabase.auth.signOut();

      // 🔐 POZOVI SERVER LOGOUT (briše SSR cookie)
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      toast.success("Лозинка успешно промењена. Пријавите се поново.");

      setTimeout(() => {
        router.push("/"); // login stranica
      }, 1000);
    } catch (err) {
      toast.error(err.message || "Дошло је до грешке.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-black mb-6">
          Нова лозинка
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Нова лозинка"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 text-gray-900 px-3 py-2 rounded-md"
          />

          <input
            type="password"
            placeholder="Потврда лозинке"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 text-gray-900 px-3 py-2 rounded-md"
          />

          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-2 rounded-md hover:bg-blue-900 transition"
          >
            Сачувај
          </button>
        </form>
      </div>
    </div>
  );
}
