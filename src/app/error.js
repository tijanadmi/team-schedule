"use client";

import { useRouter } from "next/navigation";

export default function Error({ error, reset }) {
  const router = useRouter();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS meseci idu od 0-11

  return (
    <main className="flex justify-center items-center flex-col gap-6">
      <h1 className="text-3xl font-semibold">Nešto je krenulo naopako!</h1>
      <p className="text-lg">{error.message}</p>

      <button
        className="inline-block bg-accent-500 text-primary-800 px-6 py-3 text-lg"
        onClick={reset}
      >
        Pokušaj ponovo
      </button>

      <button
        className="inline-block bg-gray-300 text-gray-900 px-6 py-3 text-lg"
        onClick={() => router.push(`/dashboard/${year}/${month}`)} // ide na početnu
      >
        Početna
      </button>
    </main>
  );
}
