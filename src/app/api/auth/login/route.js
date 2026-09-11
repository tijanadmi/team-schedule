// // app/api/auth/login/route.js
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { createServerClient } from "@supabase/ssr";

// export async function POST(req) {
//   const formData = await req.formData();
//   const email = formData.get("email");
//   const password = formData.get("password");

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_KEY,
//     {
//       cookies: {
//         get(name) {
//           return cookies().get(name)?.value;
//         },
//         set(name, value, opts) {
//           cookies().set({ name, value, ...opts });
//         },
//         remove(name) {
//           cookies().delete(name);
//         },
//       },
//     }
//   );

//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 401 });
//   }

//   return NextResponse.json({ success: true, user: data.user });
// }

import { NextResponse } from "next/server";

import { createActionSupabaseClient } from "@/lib/supabase/action";
import { AccessError, requireActiveEmployee } from "@/lib/access";

export async function POST(req) {
  const supabase = await createActionSupabaseClient();
  let signedIn = false;

  try {
    const formData = await req.formData();

    const email = formData.get("email");
    const password = formData.get("password");

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Унесите email и лозинку." },
        { status: 400 },
      );
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Неуспешна пријава. Проверите податке." },
        { status: 401 },
      );
    }

    signedIn = true;

    await requireActiveEmployee(supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Ne ostavljamo ovu sesiju otvorenu ako provera pristupa ne uspe.
    if (signedIn) {
      try {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });

        if (signOutError) {
          console.error(
            "Odjava nakon odbijene prijave nije uspela:",
            signOutError.message,
          );
        }
      } catch {
        console.error("Odjava nakon odbijene prijave nije uspela.");
      }
    }

    const status = error instanceof AccessError ? error.status : 500;

    return NextResponse.json(
      {
        error:
          error instanceof AccessError
            ? error.message
            : "Пријава тренутно није могућа. Покушајте поново.",
      },
      { status },
    );
  }
}
