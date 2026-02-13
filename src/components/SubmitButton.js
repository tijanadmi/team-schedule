"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="bg-pink-600 text-white px-6 py-3 rounded-full transition duration-300 hover:text-pink-100 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white"
      disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
