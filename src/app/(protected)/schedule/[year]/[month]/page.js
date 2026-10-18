// src/app/(protected)/schedule/[year]/[month]/page.js
import Layout from "@/components/Layout";
import Link from "next/link";
import { /*daysInMonth,*/ prevNext } from "@/lib/calendar";
import { isEmployedOnDate } from "@/lib/employment";
import {
  getEmployeesForCurrentUser,
  getStatuses,
  getScheduleForMonth,
  getCurrentUserWithRole,
} from "@/lib/data-service";
import { StatusSelect } from "@/components/StatusSelect";
import ScheduleScrollContainer from "@/components/ScheduleScrollContainer";

import { getWorkCalendar } from "@/lib/work-calendar-service";
import { buildCalendarDays } from "@/lib/work-calendar";

export const revalidate = 0;

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export default async function SchedulePage({ params }) {
  const year = Number(params.year);
  const month = Number(params.month);

  // const dim = daysInMonth(year, month);
  // const days = Array.from({ length: dim }, (_, i) => i + 1);
  const { prev, next } = prevNext(year, month);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("sr-RS", {
    month: "long",
    year: "numeric",
  });

  // const [employees = [], statuses = [], schedule = []] = await Promise.all([
  //   getEmployeesForCurrentUser(year, month),
  //   getStatuses().catch(() => []),
  //   getScheduleForMonth(year, month).catch(() => []),
  // ]);

  const [employees = [], statuses = [], schedule = [], workCalendar] =
    await Promise.all([
      getEmployeesForCurrentUser(year, month),
      getStatuses(),
      getScheduleForMonth(year, month),
      getWorkCalendar(year, month),
    ]);

  const calendarDays = buildCalendarDays(year, month, workCalendar.holidays);

  const currentUser = await getCurrentUserWithRole();
  if (!currentUser)
    return <p className="p-4 text-center">Niste prijavljeni.</p>;

  const currentUserId = currentUser.id;
  const currentUserRole = currentUser.role;

  const scheduleMap = new Map();
  schedule.forEach((r) =>
    scheduleMap.set(`${r.user_id}-${r.work_date}`, r.status_id),
  );

  if (!employees.length)
    return <p className="p-4 text-center">Nema zaposlenih za prikaz.</p>;

  return (
    <Layout>
      <section className="bg-gray-100 text-gray-800  px-4 sm:px-6 lg:px-8">
        {!workCalendar.confirmed && (
          <p
            role="status"
            className="mb-4 rounded bg-amber-100 p-3 text-sm text-amber-900"
          >
            Календар за овај месец није потврђен. Преглед је доступан, али је
            унос статуса онемогућен до потврде администратора.
          </p>
        )}
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4 mt-4 sm:mt-6 w-full px-1 sm:px-2">
          <Link
            href={`/schedule/${prev.year}/${prev.month}`}
            className="text-lg font-semibold flex-shrink-0"
          >
            &lt;&lt;
          </Link>

          <h3 className="text-lg sm:text-xl font-semibold text-blue-800 flex-grow text-center min-w-0 truncate">
            {monthLabel}
          </h3>

          <Link
            href={`/schedule/${next.year}/${next.month}`}
            className="text-lg font-semibold flex-shrink-0"
          >
            &gt;&gt;
          </Link>
        </div>

        {/* TABLE */}
        <ScheduleScrollContainer
          key={`${currentUserId}-${year}-${month}`}
          scrollKey={`${currentUserId}-${year}-${month}`}
        >
          <table className="table-fixed w-max min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-50 border px-2 sm:px-3 py-1.5 sm:py-2 text-center text-blue-800 z-30 text-xs sm:text-sm">
                  Запослени
                </th>

                {calendarDays.map((dayInfo) => (
                  <th
                    key={dayInfo.day}
                    className="border px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm"
                    style={{
                      backgroundColor: dayInfo.backgroundColor || "white",
                    }}
                    title={dayInfo.reason || undefined}
                  >
                    <div className="font-medium">{dayInfo.day}</div>
                    <div className="text-[10px] sm:text-xs font-light">
                      {daysOfWeek[dayInfo.weekday]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white font-medium z-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
                    {emp.full_name}
                  </td>

                  {calendarDays.map((dayInfo) => {
                    const date = dayInfo.date;
                    const value = scheduleMap.get(`${emp.id}-${date}`) ?? null;

                    const isEmployed = isEmployedOnDate(emp, date);

                    const hasEditPermission =
                      emp.id === currentUserId ||
                      emp.manager_id === currentUserId ||
                      currentUserRole === "admin";

                    const canEdit =
                      hasEditPermission &&
                      isEmployed &&
                      workCalendar.confirmed &&
                      !dayInfo.isNonWorking;

                    const existingOnNonWorkingDay =
                      dayInfo.isNonWorking && value !== null;

                    const explanation = [
                      dayInfo.reason,
                      !isEmployed
                        ? "Запослени није у радном односу на овај датум."
                        : "",
                      !workCalendar.confirmed
                        ? "Календар месеца није потврђен."
                        : "",
                      existingOnNonWorkingDay
                        ? "Постојећи статус на нерадном дану — потребна је провера."
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" — ");

                    return (
                      <td
                        key={dayInfo.day}
                        className="border px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm"
                        style={{
                          backgroundColor: !isEmployed
                            ? "#e5e7eb"
                            : dayInfo.backgroundColor || "transparent",
                        }}
                        title={explanation || undefined}
                      >
                        <StatusSelect
                          employeeId={emp.id}
                          date={date}
                          value={value}
                          statuses={statuses}
                          canEdit={canEdit}
                        />

                        {existingOnNonWorkingDay && (
                          <span
                            className="text-amber-800"
                            aria-label="Постојећи статус на нерадном дану"
                          >
                            {" "}
                            ⚠
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScheduleScrollContainer>
      </section>
    </Layout>
  );
}
