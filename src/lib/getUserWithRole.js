// import { createServerSupabaseClient } from "./supabase/server";

// export async function getUserWithRole() {
//   const supabase = createServerSupabaseClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return null;

//   const { data: employee } = await supabase
//     .from("employees")
//     .select("role, full_name")
//     .eq("id", user.id)
//     .single();

//   return {
//     ...user,
//     role: employee?.role || "user",
//     full_name: employee?.full_name,
//   };
// }

import { AccessError, requireActiveEmployee } from "@/lib/access";

export async function getUserWithRole() {
  try {
    const { user, employee } = await requireActiveEmployee();

    return {
      ...user,
      role: employee.role,
      full_name: employee.full_name,
    };
  } catch (error) {
    if (error instanceof AccessError) {
      return null;
    }

    throw error;
  }
}
