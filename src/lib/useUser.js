// lib/useUser.ts
import { useState, useEffect } from "react";
// import { usePathname } from "next/navigation";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include", // jako važno za cookie!
        });
        if (res.status === 401) {
          // Očekivano kada korisnik nije logovan
          setUser(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data?.user || null);
      } catch (error) {
        console.error("Greška pri dohvaćanju korisnika:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
