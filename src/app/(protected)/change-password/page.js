"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
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
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Грешка при промени лозинке.");
      }

      toast.success("Лозинка је успешно промењена.");

      setTimeout(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JS meseci idu od 0-11

        // preusmeri na dashboard sa parametrima

        router.push(`/dashboard/${year}/${month}`);
      }, 1000);
    } catch (err) {
      toast.error(err.message || "Дошло је до грешке.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-300 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-black mb-6">
          Промена лозинке
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-900 font-medium">
              Нова лозинка
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-900 font-medium">
              Потврда лозинке
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white"
              required
            />
          </div>

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
