"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (password !== confirmPassword) {
      setErrorMsg("Лозинке се не поклапају");
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

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Грешка при промени лозинке");
        return;
      }

      setMessage("Лозинка је успешно промењена");

      setTimeout(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JS meseci idu od 0-11

        // preusmeri na dashboard sa parametrima

        router.push(`/dashboard/${year}/${month}`);
      }, 1000);
    } catch (err) {
      setErrorMsg("Грешка на серверу" || err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-300 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Промена лозинке
        </h2>

        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
        {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
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
            <label className="block mb-1 text-sm font-medium">
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
