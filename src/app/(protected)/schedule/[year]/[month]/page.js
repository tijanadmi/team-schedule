// src/app/(protected)/schedule/[year]/[month]/page.js
import Layout from "@/components/Layout";
import Link from "next/link";
import { daysInMonth, prevNext } from "@/lib/calendar";
import {
  getEmployeesForCurrentUser,
  getStatuses,
  getScheduleForMonth,
  getCurrentUserWithRole,
} from "@/lib/data-service";
import { StatusSelect } from "@/components/StatusSelect";

export const revalidate = 0;

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export default async function SchedulePage({ params }) {
  const year = Number(params.year);
  const month = Number(params.month);

  const dim = daysInMonth(year, month);
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const { prev, next } = prevNext(year, month);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("sr-RS", {
    month: "long",
    year: "numeric",
  });

  const [employees = [], statuses = [], schedule = []] = await Promise.all([
    getEmployeesForCurrentUser().catch(() => []),
    getStatuses().catch(() => []),
    getScheduleForMonth(year, month).catch(() => []),
  ]);

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
      <section className="bg-white text-gray-800 py-6 px-2 sm:px-6 lg:px-8">
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
        <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="table-fixed w-max min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-50 border px-2 sm:px-3 py-1.5 sm:py-2 text-center text-blue-800 z-30 text-xs sm:text-sm">
                  Запослени
                </th>

                {days.map((d) => {
                  const dayOfWeek = new Date(year, month - 1, d).getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <th
                      key={d}
                      className="border px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm"
                      style={{
                        backgroundColor: isWeekend ? "#f0f0f0" : "white",
                      }}
                    >
                      <div className="font-medium">{d}</div>
                      <div className="text-[10px] sm:text-xs font-light">
                        {daysOfWeek[dayOfWeek]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white font-medium z-10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
                    {emp.full_name}
                  </td>

                  {days.map((d) => {
                    const date = `${year}-${String(month).padStart(
                      2,
                      "0",
                    )}-${String(d).padStart(2, "0")}`;

                    const key = `${emp.id}-${date}`;
                    const value = scheduleMap.get(key) ?? null;

                    const canEdit =
                      emp.id === currentUserId ||
                      emp.manager_id === currentUserId ||
                      currentUserRole === "admin";

                    const dayOfWeek = new Date(year, month - 1, d).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                      <td
                        key={d}
                        className="border px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm"
                        style={{
                          backgroundColor: isWeekend
                            ? "#f0f0f0"
                            : "transparent",
                        }}
                      >
                        <StatusSelect
                          employeeId={emp.id}
                          date={date}
                          value={value}
                          statuses={statuses}
                          canEdit={canEdit}
                        />
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
