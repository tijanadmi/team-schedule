import { isEmployedOnDate } from "@/lib/employment";

export function getMonthBounds(year, month) {
  const y = Number(year);
  const m = Number(month);

  if (
    !Number.isInteger(y) ||
    y < 2000 ||
    y > 2100 ||
    !Number.isInteger(m) ||
    m < 1 ||
    m > 12
  ) {
    throw new Error("Неисправна година или месец.");
  }

  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const prefix = `${y}-${String(m).padStart(2, "0")}`;

  return {
    year: y,
    month: m,
    count,
    start: `${prefix}-01`,
    end: `${prefix}-${String(count).padStart(2, "0")}`,
  };
}

export function buildCalendarDays(year, month, holidays) {
  const bounds = getMonthBounds(year, month);

  const holidayMap = new Map(
    holidays.map((holiday) => [holiday.date, holiday.name]),
  );

  return Array.from({ length: bounds.count }, (_, index) => {
    const day = index + 1;

    const date = `${bounds.year}-${String(bounds.month).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const holidayName = holidayMap.get(date) || "";

    return {
      day,
      date,
      weekday,
      isWeekend,
      holidayName,
      isNonWorking: isWeekend || Boolean(holidayName),
      reason: holidayName || (isWeekend ? "Викенд" : ""),
      backgroundColor: holidayName ? "#fff3cd" : isWeekend ? "#f0f0f0" : null,
    };
  });
}

export function calculateRemotePercent(
  employees,
  statusMap,
  scheduleMap,
  calendarDays,
  confirmed,
) {
  const result = {};

  for (const dayInfo of calendarDays) {
    // Nepotvrđen kalendar nije pouzdana osnova za obračun.
    if (!confirmed || dayInfo.isNonWorking) {
      result[dayInfo.day] = null;
      continue;
    }

    const employeesForDay = employees.filter((employee) =>
      isEmployedOnDate(employee, dayInfo.date),
    );

    const remoteCount = employeesForDay.reduce((count, employee) => {
      const statusId = scheduleMap.get(`${employee.id}-${dayInfo.date}`);

      return count + (statusMap.get(statusId)?.code === "REMOTE" ? 1 : 0);
    }, 0);

    result[dayInfo.day] =
      employeesForDay.length > 0
        ? Math.round((remoteCount / employeesForDay.length) * 100)
        : 0;
  }

  return result;
}
