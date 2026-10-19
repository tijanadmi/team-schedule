// src/app/(protected)/dashboard/[year]/[month]/page.js
import Layout from "@/components/Layout";
import Link from "next/link";
import { prevNext } from "@/lib/calendar";
// import { isEmployedOnDate } from "@/lib/employment";
import {
  // getEmployees,
  getEmployeesByOrg,
  getStatuses,
  getScheduleForMonthDashboard,
} from "@/lib/data-service";

import { getWorkCalendar } from "@/lib/work-calendar-service";
import { buildCalendarDays, calculateRemotePercent } from "@/lib/work-calendar";

import { requirePageAccess } from "@/lib/page-access";

export const revalidate = 0;

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export default async function DashboardMonthPage({ params }) {

  await requirePageAccess();
  const now = new Date();
  const year = params?.year ? Number(params.year) : now.getFullYear();
  const month = params?.month ? Number(params.month) : now.getMonth() + 1;

  // const dim = daysInMonth(year, month);
  // const days = Array.from({ length: dim }, (_, i) => i + 1);
  const { prev, next } = prevNext(year, month);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("sr-RS", {
    month: "long",
    year: "numeric",
  });

  // const [employees = [], statuses = [], schedule = []] = await Promise.all([
  //   getEmployeesByOrg(year, month),
  //   getStatuses(),
  //   getScheduleForMonthDashboard(year, month),
  // ]);

  const [employees = [], statuses = [], schedule = [], workCalendar] =
    await Promise.all([
      getEmployeesByOrg(year, month),
      getStatuses(),
      getScheduleForMonthDashboard(year, month),
      getWorkCalendar(year, month),
    ]);

  const calendarDays = buildCalendarDays(year, month, workCalendar.holidays);

  employees.sort((a, b) => a.org.localeCompare(b.org));

  const statusMap = new Map();
  statuses.forEach((s) => statusMap.set(s.id, s));

  const scheduleMap = new Map();
  schedule.forEach((r) => {
    scheduleMap.set(`${r.user_id}-${r.work_date}`, r.status_id);
  });

  /*****dodavanje dela za procenat */
  // Dnevni procenat rada od kuće među zaposlenima na taj datum.
  // const workFromHomePercent = {};
  const workFromHomePercent = calculateRemotePercent(
    employees,
    statusMap,
    scheduleMap,
    calendarDays,
    workCalendar.confirmed,
  );

  /****** kraj dela za procenat */

  return (
    <Layout>
      {/* <section className="flex-1 flex flex-col overflow-hidden"> */}
      <section className="bg-gray-100 text-gray-800 w-full  px-4 sm:px-6 lg:px-8 m-0">
        {/* HEADER */}
        {/* <div className="flex items-center justify-between mb-4 mt-4 sm:mt-6 w-full"> */}
        <div className="flex items-center justify-between mb-2 mt-2 sm:mt-6 ">
          <Link
            href={`/dashboard/${prev.year}/${prev.month}`}
            className="text-lg font-semibold  flex-shrink-0"
          >
            &lt;&lt;
          </Link>

          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-800">
              {monthLabel}
            </h3>

            <a
              href={`/api/dashboard-export/${year}/${month}`}
              className="bg-blue-600 text-white text-xs sm:text-sm px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Excel
            </a>
          </div>

          <Link
            href={`/dashboard/${next.year}/${next.month}`}
            className="text-lg font-semibold flex-shrink-0"
          >
            &gt;&gt;
          </Link>
        </div>

        {!workCalendar.confirmed && (
          <p className="mb-3 rounded bg-amber-100 p-3 text-sm text-amber-900">
            Календар месеца није потврђен. Подаци су приказани за преглед, а
            проценти се не обрачунавају до потврде.
          </p>
        )}

        {/* TABLE WRAPPER */}

        {/* TABLE WRAPPER */}
        {/* <div className="w-full overflow-x-auto overflow-y-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="w-max sm:w-full border-collapse text-sm"> */}
        {/* <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="w-full border-collapse text-sm"> */}
        {/* <div className="overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="min-w-[1200px] w-full border-collapse text-sm"> */}
        <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md m-0">
          <table className="min-w-[1200px] table-fixed border-collapse text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-50 border w-[200px] text-center text-blue-800 z-30 text-sm sm:text-sm">
                  {/* <th className="sticky left-0 bg-gray-50 border px-1 sm:px-2 py-0.5 sm:py-1 text-center text-blue-800 z-30 min-w-[200px] text-xs sm:text-sm"> */}
                  Запослени
                </th>
                {calendarDays.map((dayInfo) => (
                  <th
                    key={dayInfo.day}
                    className="border px-2 py-1 sm:py-2 text-center min-w-[28px] sm:min-w-[32px] text-[10px] sm:text-xs"
                    style={{
                      backgroundColor: dayInfo.backgroundColor || "white",
                    }}
                    title={dayInfo.reason || undefined}
                  >
                    <div className="font-medium">{dayInfo.day}</div>
                    <div className="text-[9px] sm:text-[10px] font-light">
                      {daysOfWeek[dayInfo.weekday]}
                    </div>
                  </th>
                ))}
              </tr>
              {/* /**** dodavanje reda za procente *** */}
              <tr>
                <th className="sticky left-0 bg-gray-50 border text-xs text-blue-800">
                  % Рад од куће
                </th>

                {calendarDays.map((dayInfo) => {
                  const percent = workFromHomePercent[dayInfo.day];

                  return (
                    <th
                      key={`percent-${dayInfo.day}`}
                      className="border text-center text-xs font-medium"
                      style={{
                        backgroundColor:
                          dayInfo.backgroundColor ||
                          (percent !== null && percent > 30
                            ? "#fecaca"
                            : "#f9fafb"),
                      }}
                      title={
                        !workCalendar.confirmed
                          ? "Календар месеца није потврђен."
                          : dayInfo.reason || undefined
                      }
                    >
                      {percent === null ? "—" : `${percent}%`}
                    </th>
                  );
                })}
              </tr>

              {/* /**** kraj reda za procente */}
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="group hover:outline hover:outline-2 hover:outline-gray-300"
                >
                  <td className="sticky left-0 bg-gray-50 border w-[90px] min-w-[90px] max-w-[90px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-left text-blue-800 group-hover:bg-blue-100">
                    {/* <td className="sticky left-0 bg-gray-50 border w-[220px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-left text-blue-800"> */}
                    {emp.full_name}
                  </td>
                  {calendarDays.map((dayInfo) => {
                    const statusId = scheduleMap.get(
                      `${emp.id}-${dayInfo.date}`,
                    );
                    const status = statusMap.get(statusId);

                    const warning =
                      dayInfo.isNonWorking && statusId != null
                        ? "Постојећи статус на нерадном дану — потребна је провера."
                        : "";

                    return (
                      <td
                        key={dayInfo.day}
                        className="border w-[60px] px-1.5 py-[4px] text-center text-[10px] leading-tight"
                        style={{
                          backgroundColor:
                            dayInfo.backgroundColor ||
                            status?.color_hex ||
                            "transparent",
                        }}
                        title={[dayInfo.reason, status?.label, warning]
                          .filter(Boolean)
                          .join(" — ")}
                      >
                        <span className="hidden sm:inline">
                          {status?.label || ""}
                        </span>

                        <span className="inline sm:hidden">
                          {status?.code_sr || ""}
                        </span>

                        {warning && <span className="text-amber-800"> ⚠</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
