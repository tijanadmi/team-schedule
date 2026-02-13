"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

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
        setErrorMsg(errorData.error || "Грешка при пријави");
        return;
      }

      // dobavi tekući mesec i godinu
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JS meseci idu od 0-11

      // preusmeri na dashboard sa parametrima
      router.push(`/dashboard/${year}/${month}`);
    } catch (err) {
      setErrorMsg("Неуспешна пријава");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">ТИС</h2>
        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Шифра</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Лозинка</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-2 rounded-md hover:bg-blue-900 transition"
          >
            Пријави се
          </button>
        </form>
      </div>
    </div>
  );
}
