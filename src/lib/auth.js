import { supabase } from "./supabase";

// import { cookies } from "next/headers";
// import { createServerClient } from "@supabase/ssr";

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // console.log("Login data iz logina:", data);

  if (error) throw new Error(error.message);

  return data;
}

// export async function getCurrentUserWithRole() {
//   const cookieStore = cookies();

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_KEY,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options),
//           );
//         },
//       },
//     },
//   );

//   // auth user
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return null;

//   // employee role
//   const { data: employee } = await supabase
//     .from("employees")
//     .select("role, full_name, manager_id")
//     .eq("id", user.id)
//     .single();

//   return {
//     ...user,
//     role: employee?.role ?? "user",
//     full_name: employee?.full_name,
//     manager_id: employee?.manager_id,
//   };
// }
