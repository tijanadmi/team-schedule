"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY,
);

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (password !== confirmPassword) {
      setErrorMsg("Лозинке се не поклапају");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // 🔐 ODMAH IZLOGUJ KORISNIKA
    // await supabase.auth.signOut();

    // 🔐 POZOVI SERVER LOGOUT (briše SSR cookie)
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    setMessage("Лозинка успешно промењена. Пријавите се поново.");

    setTimeout(() => {
      router.push("/"); // login stranica
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-black mb-6">
          Нова лозинка
        </h2>

        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

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
