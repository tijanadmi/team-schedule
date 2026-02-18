// src/app/(protected)/dashboard/[year]/[month]/page.js
import Layout from "@/components/Layout";
import Link from "next/link";
import { daysInMonth, prevNext } from "@/lib/calendar";
import {
  getEmployees,
  getStatuses,
  getScheduleForMonthDashboard,
} from "@/lib/data-service";

export const revalidate = 0;

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export default async function DashboardMonthPage({ params }) {
  const now = new Date();
  const year = params?.year ? Number(params.year) : now.getFullYear();
  const month = params?.month ? Number(params.month) : now.getMonth() + 1;

  const dim = daysInMonth(year, month);
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  const { prev, next } = prevNext(year, month);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("sr-RS", {
    month: "long",
    year: "numeric",
  });

  const [employees = [], statuses = [], schedule = []] = await Promise.all([
    getEmployees(),
    getStatuses(),
    getScheduleForMonthDashboard(year, month),
  ]);

  employees.sort((a, b) => a.org.localeCompare(b.org));

  const statusMap = new Map();
  statuses.forEach((s) => statusMap.set(s.id, s));

  const scheduleMap = new Map();
  schedule.forEach((r) => {
    scheduleMap.set(`${r.user_id}-${r.work_date}`, r.status_id);
  });

  return (
    <Layout>
      {/* <section className="bg-white text-gray-800 py-6 px-2 sm:px-6 lg:px-8"> */}
      <section className="bg-white text-gray-800 w-full  px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        {/* <div className="flex items-center justify-between mb-4 mt-4 sm:mt-6 w-full"> */}
        <div className="flex items-center justify-between mb-4 mt-4 sm:mt-6">
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

        {/* TABLE WRAPPER */}
        {/* <div className="w-full overflow-x-auto overflow-y-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="w-max sm:w-full border-collapse text-sm"> */}
        {/* <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="w-full border-collapse text-sm"> */}
        {/* <div className="overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="min-w-[1200px] w-full border-collapse text-sm"> */}
        <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md">
          <table className="min-w-[1200px] table-fixed border-collapse text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-50 border w-[200px] text-center text-blue-800 z-30 text-sm sm:text-sm">
                  {/* <th className="sticky left-0 bg-gray-50 border px-1 sm:px-2 py-0.5 sm:py-1 text-center text-blue-800 z-30 min-w-[200px] text-xs sm:text-sm"> */}
                  Запослени
                </th>
                {days.map((d) => {
                  const dayOfWeek = new Date(year, month - 1, d).getDay();
                  return (
                    <th
                      key={d}
                      className="border px-2 sm:px-2 py-1 sm:py-2 text-center min-w-[35px] sm:min-w-[45px] text-xs sm:text-sm"
                      // className="border w-[45px] text-center text-xs sm:text-sm"
                      style={{
                        backgroundColor:
                          dayOfWeek === 0 || dayOfWeek === 6
                            ? "#f0f0f0"
                            : "white",
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
                  <td
                    // className="sticky left-0 bg-white font-medium w-[45px] z-10 px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm"
                    // className="sticky left-0 bg-gray-50 border w-[200px]  text-blue-800  sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm"
                    // className="sticky left-0 bg-gray-50 border w-[200px] text-blue-800 px-3 sm:px-4 py-1 sm:py-2 text-sm"
                    // className="sticky left-0 bg-gray-50 border w-[200px] px-4 py-2 text-left text-blue-800 text-sm font-medium"
                    className="sticky left-0 bg-gray-50 border w-[220px] px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-left text-blue-800"

                    // style={{ minWidth: "120px" }}
                  >
                    {emp.full_name}
                  </td>
                  {days.map((d) => {
                    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const statusId = scheduleMap.get(`${emp.id}-${date}`);
                    const status = statusMap.get(statusId);
                    const dayOfWeek = new Date(year, month - 1, d).getDay();

                    return (
                      <td
                        key={d}
                        // className="border px-1 sm:px-2 py-1 sm:py-1 text-center text-xs sm:text-sm break-words"
                        // className="border w-[45px] text-center text-xs overflow-hidden"
                        className="border w-[85px] px-2 py-1 text-center text-xs leading-tight"
                        style={{
                          backgroundColor:
                            dayOfWeek === 0 || dayOfWeek === 6
                              ? "#f0f0f0"
                              : status?.color_hex || "transparent",
                        }}
                        title={status?.label}
                      >
                        <span className="hidden sm:inline">
                          {status?.label || ""}
                        </span>
                        <span className="inline sm:hidden">
                          {status?.code_sr || ""}
                        </span>
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
