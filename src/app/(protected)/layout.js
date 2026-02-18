// src/app/my_posts/layout.js
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
  const supabase = createServerSupabaseClient();
  // console.log("ProtectedLayout running...");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // console.log("Session:", session);
  if (!session?.user) {
    redirect("/login"); // ili gde god ti je login stranica
  }

  return (
    // <div className="min-h-screen w-full overflow-x-hidden bg-white text-gray-800">
    //   {/* fluid container */}
    //   <div className="w-full">{children}</div>
    // </div>
    // <div className="min-h-screen w-screen overflow-x-hidden bg-white text-gray-800">
    //   {children}
    // </div>
    <>{children}</>
  );
}
