"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    toast.loading("Пријављивање...", { id: "login" });

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Грешка при пријави.");
      }

      // dobavi tekući mesec i godinu
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JS meseci idu od 0-11

      // Discard pages cached under the previous session.
      window.location.replace(`/dashboard/${year}/${month}`);
    } catch (err) {
      toast.error(err.message || "Неуспешна пријава", { id: "login" });
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl text-black font-semibold text-center mb-6">
          ТИС
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-gray-900 font-medium">
              Шифра
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white text-black"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-900 font-medium">
              Лозинка
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white text-black"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full bg-blue-800 text-white py-2 rounded-md hover:bg-blue-900 transition"
          >
            {loading ? "Пријављивање..." : "Пријави се"}
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          <a href="/reset-password" className="text-blue-700 hover:underline">
            Заборавили сте лозинку?
          </a>
        </p>
      </div>
    </div>
  );
}
