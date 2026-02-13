// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req) {
  const formData = await req.formData();
  const email = formData.get("email");
  const password = formData.get("password");

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
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true, user: data.user });
}
