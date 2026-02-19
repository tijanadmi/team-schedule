import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req) {
  const { password } = await req.json();

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

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
