import Link from "next/link";

function NotFound() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS meseci idu od 0-11

  return (
    <main className="text-center space-y-6 mt-4">
      <h1 className="text-3xl font-semibold">
        Ova stranica ne postoji ili je uklonjena!
      </h1>
      <Link
        href={`/dashboard/${year}/${month}`}
        className="inline-block bg-accent-500 text-primary-800 px-6 py-3 text-lg"
      >
        Vrati se na početnu stranicu
      </Link>
    </main>
  );
}

export default NotFound;
