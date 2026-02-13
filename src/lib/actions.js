"use server";

// import { supabase, supabaseUrl } from "./supabase";
import { createActionSupabaseClient } from "@/lib/supabase/action";
import { revalidatePath } from "next/cache";

/** Ažurira status zaposlenog za određeni datum */
export async function updateWorkStatus(employeeId, date, statusId) {
  const supabase = await createActionSupabaseClient();

  const [year, month] = date.split("-");

  if (statusId === null || statusId === undefined) {
    const { error } = await supabase
      .from("work_schedule")
      .delete()
      .eq("user_id", employeeId)
      .eq("work_date", date);

    if (error) throw new Error(error.message);

    revalidatePath(`/schedule/${year}/${month}`);
    // revalidatePath(`/schedule`);
    return;
  }

  const { error } = await supabase.from("work_schedule").upsert(
    {
      user_id: employeeId,
      work_date: date,
      status_id: statusId,
    },
    {
      onConflict: "user_id,work_date", // 👈 KLJUČNO
    },
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/schedule/${year}/${month}`);
  // revalidatePath(`/schedule`);
}
