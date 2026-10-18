"use server";

import { createActionSupabaseClient } from "@/lib/supabase/action";
import { isEmployedOnDate } from "@/lib/employment";
import { requireActiveEmployee } from "@/lib/access";

import { getWorkCalendar } from "@/lib/work-calendar-service";
import { buildCalendarDays } from "@/lib/work-calendar";

export async function updateWorkStatus(employeeId, date, statusId) {
  // Datum mora biti stvaran kalendarski datum u formatu YYYY-MM-DD.
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Неисправан датум.");
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Неисправан датум.");
  }

  const isDelete = statusId === null || statusId === undefined;

  if (!isDelete && (!Number.isInteger(statusId) || statusId <= 0)) {
    throw new Error("Неисправан статус.");
  }

  // const supabase = await createActionSupabaseClient();

  // const {
  //   data: { user },
  //   error: authError,
  // } = await supabase.auth.getUser();

  // if (authError || !user) {
  //   throw new Error("Морате бити пријављени.");
  // }

  // const [
  //   { data: currentEmployee, error: currentEmployeeError },
  //   { data: employee, error: employeeError },
  // ] = await Promise.all([
  //   supabase.from("employees").select("id, role").eq("id", user.id).single(),

  //   supabase
  //     .from("employees")
  //     .select("id, manager_id, employment_start_date, employment_end_date")
  //     .eq("id", employeeId)
  //     .single(),
  // ]);

  // if (currentEmployeeError || !currentEmployee) {
  //   throw new Error("Не могу да учитам пријављеног корисника.");
  // }

  // if (employeeError || !employee) {
  //   throw new Error("Не могу да учитам запосленог.");
  // }

  const supabase = await createActionSupabaseClient();

  const { user, employee: currentEmployee } =
    await requireActiveEmployee(supabase);

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, manager_id, employment_start_date, employment_end_date")
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    throw new Error("Не могу да учитам запосленог.");
  }

  const hasEditPermission =
    employee.id === user.id ||
    employee.manager_id === user.id ||
    currentEmployee.role === "admin";

  if (!hasEditPermission) {
    throw new Error("Немате дозволу за измену овог запосленог.");
  }

  // Ovlašćenom korisniku ostaje dozvoljeno uklanjanje pogrešnog zapisa.
  if (isDelete) {
    const { error } = await supabase
      .from("work_schedule")
      .delete()
      .eq("user_id", employeeId)
      .eq("work_date", date);

    if (error) throw new Error(error.message);

    return;
  }

  // Novi upisi i izmene dozvoljeni su samo tokom zaposlenja.
  if (!isEmployedOnDate(employee, date)) {
    throw new Error("Није дозвољен унос статуса ван периода запослења.");
  }

  const [year, month, day] = date.split("-").map(Number);

  const workCalendar = await getWorkCalendar(year, month);

  if (!workCalendar.confirmed) {
    throw new Error(
      "Календар месеца није потврђен. Унос статуса није дозвољен.",
    );
  }

  const calendarDays = buildCalendarDays(year, month, workCalendar.holidays);

  const dayInfo = calendarDays[day - 1];

  if (!dayInfo || dayInfo.date !== date) {
    throw new Error("Неисправан датум.");
  }

  if (dayInfo.isNonWorking) {
    throw new Error(
      "Није дозвољен унос статуса суботом, недељом или празником.",
    );
  }

  const { error } = await supabase.from("work_schedule").upsert(
    {
      user_id: employeeId,
      work_date: date,
      status_id: statusId,
    },
    {
      onConflict: "user_id,work_date",
    },
  );

  if (error) throw new Error(error.message);
}
