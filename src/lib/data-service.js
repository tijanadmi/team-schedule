import { supabase } from "./supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/*
Funkcija za filtriranje zaposlenih koji su aktivni u datom mesecu.
Oba uslova moraju da budu zadovoljena:
- zaposlenje je počelo najkasnije poslednjeg dana meseca, ili početak nije evidentiran;
- odlazak nije evidentiran, ili je poslednji dan zaposlenja najmanje prvi dan meseca.
*/
function filterEmployeesForMonth(query, year, month) {
  const y = Number(year);
  const m = Number(month);

  if (
    !Number.isInteger(y) ||
    y < 1000 ||
    y > 9999 ||
    !Number.isInteger(m) ||
    m < 1 ||
    m > 12
  ) {
    throw new Error("Neispravna godina ili mesec.");
  }

  const lastDay = new Date(y, m, 0).getDate();
  const monthText = String(m).padStart(2, "0");

  const monthStart = `${y}-${monthText}-01`;
  const monthEnd = `${y}-${monthText}-${String(lastDay).padStart(2, "0")}`;

  return query
    .or(`employment_start_date.is.null,employment_start_date.lte.${monthEnd}`)
    .or(`employment_end_date.is.null,employment_end_date.gte.${monthStart}`);
}

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

// export async function getEmployeesForCurrentUser() {
//   const supabase = createServerSupabaseClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return [];

//   // Učitaj rolu i manager_id
//   const { data: employee, error: empError } = await supabase
//     .from("employees")
//     .select("id, role")
//     .eq("id", user.id)
//     .single();

//   if (empError) throw new Error("Ne mogu da učitam zaposlenog.");

//   // ADMIN → svi
//   if (employee.role === "admin") {
//     const { data, error } = await supabase
//       .from("employees")
//       .select("*")
//       .neq("role", "gle") // filtrira sve osim gde je role = "gle"
//       .order("org", { ascending: true })
//       .order("sort", { ascending: true });

//     if (error) throw new Error("Zaposleni nisu mogli biti učitani");
//     return data;
//   }

//   // MANAGER → on + njegovi zaposleni
//   if (employee.role === "manager") {
//     const { data, error } = await supabase
//       .from("employees")
//       .select("*")
//       .or(`id.eq.${user.id},manager_id.eq.${user.id}`)
//       .order("org", { ascending: true })
//       .order("sort", { ascending: true });

//     if (error) throw new Error("Zaposleni nisu mogli biti učitani");
//     return data;
//   }

//   // USER → samo on
//   const { data, error } = await supabase
//     .from("employees")
//     .select("*")
//     .eq("id", user.id)
//     .order("org", { ascending: true })
//     .order("sort", { ascending: true });

//   if (error) throw new Error("Zaposleni nisu mogli biti učitani");
//   return data;
// }
export async function getEmployeesForCurrentUser(year, month) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (empError || !employee) {
    throw new Error("Ne mogu da učitam zaposlenog.");
  }

  let query = supabase.from("employees").select("*");

  if (employee.role === "admin") {
    // Administrator vidi sve osim GLE.
    query = query.neq("role", "gle");
  } else if (employee.role === "manager") {
    // Rukovodilac vidi sebe i svoje zaposlene.
    query = query.or(`id.eq.${user.id},manager_id.eq.${user.id}`);
  } else {
    // Ostali korisnici vide samo sebe.
    query = query.eq("id", user.id);
  }

  query = filterEmployeesForMonth(query, year, month);

  const { data, error } = await query
    .order("org", { ascending: true })
    .order("sort", { ascending: true });

  if (error) {
    throw new Error("Zaposleni nisu mogli biti učitani.");
  }

  return data || [];
}

export async function getAuditForMonth(year, month) {
  const dim = new Date(year, month, 0).getDate();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${dim}`;

  const { data, error } = await supabase
    .from("work_schedule_audit_view")
    .select("*")
    .gte("work_date", start)
    .lte("work_date", end)
    .order("changed_at");

  if (error) throw new Error("Audit nije mogao biti učitan");

  // console.log("Audit podaci", year, month, start, end, data);
  return data;
}

// Dohvati zaposlene koje korisnik sme da vidi
// export async function getEmployeesByOrg() {
//   const supabase = createServerSupabaseClient();

//   // Ulogovani korisnik
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return [];

//   // Podaci zaposlenog
//   const { data: employee, error: empError } = await supabase
//     .from("employees")
//     .select("id, role, org")
//     .eq("id", user.id)
//     .single();

//   if (empError || !employee) {
//     throw new Error("Ne mogu da učitam zaposlenog.");
//   }

//   // Admin i GLE vide sve
//   if (employee.role === "admin" || employee.role === "gle") {
//     const { data, error } = await supabase
//       .from("employees")
//       .select("*")
//       .neq("role", "gle")
//       .order("org", { ascending: true })
//       .order("sort", { ascending: true });

//     if (error) {
//       throw new Error("Zaposleni nisu mogli biti učitani.");
//     }

//     return data;
//   }

//   // Prefiks organizacije (npr. SRTS ili SRPS)
//   const orgPrefix = employee.org.substring(0, 4);

//   // Korisnik vidi samo svoju grupaciju
//   const { data, error } = await supabase
//     .from("employees")
//     .select("*")
//     .like("org", `${orgPrefix}%`)
//     .neq("role", "gle")
//     .order("org", { ascending: true })
//     .order("sort", { ascending: true });

//   if (error) {
//     throw new Error("Zaposleni nisu mogli biti učitani.");
//   }

//   return data;
// }

export async function getEmployeesByOrg(
  year,
  month,
  { includeOutsideEmployment = false } = {},
) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id, role, org")
    .eq("id", user.id)
    .single();

  if (empError || !employee) {
    throw new Error("Ne mogu da učitam zaposlenog.");
  }

  let query = supabase.from("employees").select("*").neq("role", "gle");

  // Admin i GLE vide sve organizacije.
  // Ostali korisnici vide svoju grupaciju.
  if (employee.role !== "admin" && employee.role !== "gle") {
    if (!employee.org) {
      throw new Error("Organizacija korisnika nije evidentirana.");
    }

    const orgPrefix = employee.org.substring(0, 4);

    query = query.like("org", `${orgPrefix}%`);
  }

  if (!includeOutsideEmployment) {
    query = filterEmployeesForMonth(query, year, month);
  }

  const { data, error } = await query
    .order("org", { ascending: true })
    .order("sort", { ascending: true });

  if (error) {
    throw new Error("Zaposleni nisu mogli biti učitani.");
  }

  return data || [];
}
