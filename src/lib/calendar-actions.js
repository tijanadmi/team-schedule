"use server";

import { createActionSupabaseClient } from "@/lib/supabase/action";
import { requireActiveEmployee } from "@/lib/access";
import { fetchSerbianHolidays } from "@/lib/serbian-holidays";

async function getAdminClient() {
  const supabase = await createActionSupabaseClient();
  const { employee } = await requireActiveEmployee(supabase);

  if (employee.role !== "admin") {
    throw new Error("Приступ је дозвољен само администратору.");
  }

  return supabase;
}

function validateYear(year) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Неисправна година.");
  }
}

export async function loadCalendarYear(year) {
  try {
    validateYear(year);

    const supabase = await getAdminClient();

    const { data, error } = await supabase.rpc("get_calendar_year", {
      p_year: year,
    });

    if (error) throw new Error(error.message);

    return { ok: true, calendar: data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Календар није могао бити учитан.",
    };
  }
}

export async function confirmCalendar({
  year,
  month,
  days,
  expected,
  acceptExisting = false,
}) {
  try {
    validateYear(year);

    if (
      month !== null &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      throw new Error("Неисправан месец.");
    }

    const supabase = await getAdminClient();

    const { data, error } = await supabase.rpc("confirm_calendar", {
      p_year: year,
      p_month: month,
      p_days: days,
      p_expected: expected,
      p_accept_existing: acceptExisting === true,
    });

    if (error) throw new Error(error.message);

    if (data.needs_confirmation) {
      return {
        ok: true,
        needsConfirmation: true,
        existingRecords: data.existing_records,
      };
    }

    return { ok: true, saved: true };
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Календар није сачуван.",
    };
  }
}

export async function previewSerbianHolidays(year) {
  try {
    validateYear(year);

    // I preuzimanje je dozvoljeno samo aktivnom administratoru.
    await getAdminClient();

    const days = await fetchSerbianHolidays(year);

    return { ok: true, days };
  } catch (error) {
    return {
      ok: false,
      error:
        error.name === "TimeoutError" || error.name === "AbortError"
          ? "Сервис није одговорио на време. Покушајте поново."
          : error.message || "Празници нису могли бити преузети.",
    };
  }
}
