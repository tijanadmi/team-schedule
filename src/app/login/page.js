"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      toast.success("Успешно сте се пријавили!");

      // preusmeri na dashboard sa parametrima
      // router.push(`/dashboard/${year}/${month}`);
      setTimeout(() => {
        router.push(`/dashboard/${year}/${month}`);
      }, 800);
    } catch (err) {
      toast.error(err.message || "Неуспешна пријава");
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
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white"
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
              className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white"
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
        <p className="text-sm text-center mt-4">
          <a href="/reset-password" className="text-blue-700 hover:underline">
            Заборавили сте лозинку?
          </a>
        </p>
      </div>
    </div>
  );
}
