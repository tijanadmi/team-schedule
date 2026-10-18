import "server-only";

import { requireActiveEmployee } from "@/lib/access";
import { getMonthBounds } from "@/lib/work-calendar";

export async function getWorkCalendar(year, month) {
  const bounds = getMonthBounds(year, month);
  const { supabase } = await requireActiveEmployee();

  const [
    { data: confirmation, error: confirmationError },
    { data: holidays, error: holidaysError },
  ] = await Promise.all([
    supabase
      .from("calendar_months")
      .select("confirmed_at, revision")
      .eq("year", bounds.year)
      .eq("month", bounds.month)
      .maybeSingle(),

    supabase
      .from("non_working_days")
      .select("date, name")
      .gte("date", bounds.start)
      .lte("date", bounds.end)
      .order("date"),
  ]);

  if (confirmationError || holidaysError) {
    throw new Error("Календар нерадних дана није могао бити учитан.");
  }

  return {
    confirmed: Boolean(confirmation?.confirmed_at),
    confirmedAt: confirmation?.confirmed_at || null,
    holidays: holidays || [],
  };
}
