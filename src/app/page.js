import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Početna / TIS Evidencija",
};

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS meseci idu od 0-11

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  redirect(`/dashboard/${year}/${month}`);
}
