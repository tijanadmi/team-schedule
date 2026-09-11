import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AccessError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = "AccessError";
    this.status = status;
  }
}

function getTodayInBelgrade() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) => parts.find((part) => part.type === type).value;

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export async function requireActiveEmployee(
  supabase = createServerSupabaseClient(),
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AccessError("Морате бити пријављени.", 401);
  }

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "id, role, full_name, org, manager_id, employment_start_date, employment_end_date",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Не могу да проверим право приступа.");
  }

  if (!employee) {
    throw new AccessError("Ваш налог нема право приступа апликацији.");
  }

  const today = getTodayInBelgrade();

  if (employee.employment_end_date && today > employee.employment_end_date) {
    throw new AccessError("Ваш налог нема право приступа апликацији.");
  }

  return { supabase, user, employee };
}
