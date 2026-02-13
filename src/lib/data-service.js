import { supabase } from "./supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Dohvati sve zaposlene
export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .neq("role", "gle") // filtrira sve osim gde je role = "gle"
    .order("org", { ascending: true })
    .order("sort", { ascending: true });

  if (error) throw new Error("Zaposleni nisu mogli biti učitani");
  return data;
}

export async function getStatuses() {
  const { data, error } = await supabase
    .from("work_statuses")
    .select("*")
    .order("id");
  if (error) throw new Error("Statusi nisu mogli biti učitani");
  return data;
}

export async function getScheduleForMonth(year, month) {
  const dim = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${dim}`;
  const { data, error } = await supabase
    .from("work_schedule")
    .select("*")
    .gte("work_date", start)
    .lte("work_date", end);
  if (error) throw new Error("Raspored nije mogao biti učitan");
  return data;
}

export async function getCurrentUserWithRole() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, role, manager_id")
    .eq("id", user.id)
    .neq("role", "gle") // filtrira sve osim gde je role = "gle"
    .single();

  if (error) throw new Error("Ne mogu da učitam zaposlenog.");

  return employee;
}

export async function getScheduleForMonthDashboard(year, month) {
  const dim = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${dim}`;

  const { data, error } = await supabase
    .from("work_schedule")
    .select("user_id, work_date, status_id")
    .gte("work_date", start)
    .lte("work_date", end);

  if (error) {
    console.error(error);
    throw new Error("Raspored nije mogao biti učitan za dashboard.");
  }

  return data || [];
}

export async function getEmployeesForCurrentUser() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Učitaj rolu i manager_id
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (empError) throw new Error("Ne mogu da učitam zaposlenog.");

  // ADMIN → svi
  if (employee.role === "admin") {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .neq("role", "gle") // filtrira sve osim gde je role = "gle"
      .order("org", { ascending: true })
      .order("sort", { ascending: true });

    if (error) throw new Error("Zaposleni nisu mogli biti učitani");
    return data;
  }

  // MANAGER → on + njegovi zaposleni
  if (employee.role === "manager") {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .or(`id.eq.${user.id},manager_id.eq.${user.id}`)
      .order("org", { ascending: true })
      .order("sort", { ascending: true });

    if (error) throw new Error("Zaposleni nisu mogli biti učitani");
    return data;
  }

  // USER → samo on
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .order("org", { ascending: true })
    .order("sort", { ascending: true });

  if (error) throw new Error("Zaposleni nisu mogli biti učitani");
  return data;
}
