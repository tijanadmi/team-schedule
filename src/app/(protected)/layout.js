// src/app/my_posts/layout.js
// import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/getUserWithRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function ProtectedLayout({ children }) {
  // const supabase = createServerSupabaseClient();
  const user = await getUserWithRole();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      {/* <Header user={user} />
      <div className="min-h-screen flex flex-col bg-gray-500 text-gray-800">
        {children}
      </div>
      <Footer /> */}
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
        <Header user={user} />

        <main className="flex-1 lex flex-col bg-gray-100">{children}</main>

        <Footer />
      </div>
    </>
  );
}
