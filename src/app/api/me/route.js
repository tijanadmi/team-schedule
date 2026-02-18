// app/api/me/route.js
// app/api/me/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
        set(name, value, opts) {
          cookies().set({ name, value, ...opts });
        },
        remove(name) {
          cookies().delete(name);
        },
      },
    },
  );

  // const { data, error } = await supabase.auth.getUser();

  // if (error || !data.user) {
  //   return NextResponse.json({ user: null });
  // }

  // return NextResponse.json({ user: data.user });

  /*****Novi deo *****/
  // Dohvati Auth user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ user: null });
  }

  // Dohvati rolu iz employees tabele
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, full_name, role, manager_id")
    .eq("id", user.id)
    .single();

  if (empError) {
    console.error("Грешка при дохватању запосленог:", empError);
    return NextResponse.json({ user: null });
  }

  // Vrati spojeno
  return NextResponse.json({
    user: { ...user, role: employee?.role || "user" },
  });
  /**** kraj novog dela **** */
}
