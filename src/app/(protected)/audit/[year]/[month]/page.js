// src/app/(protected)/dashboard/[year]/[month]/page.js
import Layout from "@/components/Layout";
import AuditCell from "@/components/AuditCell";
import Link from "next/link";
import { daysInMonth, prevNext } from "@/lib/calendar";
import {
  getEmployees,
  getStatuses,
  getScheduleForMonthDashboard,
  getAuditForMonth,
} from "@/lib/data-service";

// export const dynamic = "force-dynamic";
export const revalidate = 0;
// export const fetchCache = "force-no-store";

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export default async function AuditMonthPage({ params }) {
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

  const [employees = [], statuses = [], schedule = [], audit = []] =
    await Promise.all([
      getEmployees(),
      getStatuses(),
      getScheduleForMonthDashboard(year, month),
      getAuditForMonth(year, month),
    ]);

  employees.sort((a, b) => a.org.localeCompare(b.org));

  const statusMap = new Map();
  statuses.forEach((s) => statusMap.set(s.id, s));

  const scheduleMap = new Map();
  schedule.forEach((r) => {
    scheduleMap.set(`${r.user_id}-${r.work_date}`, r.status_id);
  });

  /*** pravljenje mape istorija */

  const auditMap = new Map();

  audit.forEach((a) => {
    const key = `${a.employee_id}-${a.work_date}`;

    if (!auditMap.has(key)) {
      auditMap.set(key, []);
    }

    auditMap.get(key).push(a);
  });

  auditMap.forEach((arr) => {
    arr.sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  });

  /**** kraj pravljenja mape istorija */

  /*****dodavanje dela za procenat */
  // broj zaposlenih
  const totalEmployees = employees.length;

  // mapa: dan -> procenat rada od kuće
  const workFromHomePercent = {};

  days.forEach((d) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    let count = 0;

    employees.forEach((emp) => {
      const statusId = scheduleMap.get(`${emp.id}-${date}`);
      const status = statusMap.get(statusId);

      if (status?.code === "REMOTE") {
        count++;
      }
    });

    workFromHomePercent[d] =
      totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
  });
  /****** kraj dela za procenat */

  return (
    <Layout key={`${year}-${month}`}>
      <section className="bg-gray-100 text-gray-800 w-full  px-4 sm:px-6 lg:px-8 m-0">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-2 mt-2 sm:mt-6 ">
          <Link
            href={`/audit/${prev.year}/${prev.month}`}
            className="text-lg font-semibold  flex-shrink-0"
          >
            &lt;&lt;
          </Link>

          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-800">
              Историја измена за {monthLabel}
            </h3>
          </div>

          <Link
            href={`/audit/${next.year}/${next.month}`}
            className="text-lg font-semibold flex-shrink-0"
          >
            &gt;&gt;
          </Link>
        </div>

        {/* TABLE WRAPPER */}
        <div className="w-full overflow-x-auto max-h-[70vh] border border-gray-200 rounded-md m-0">
          <table className="min-w-[1200px] table-fixed border-collapse text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 bg-gray-50 border w-[200px] text-center text-blue-800 z-30 text-sm sm:text-sm">
                  Запослени
                </th>
                {days.map((d) => {
                  const dayOfWeek = new Date(year, month - 1, d).getDay();
                  return (
                    <th
                      key={d}
                      className="border px-2 sm:px-2 py-1 sm:py-2 text-center min-w-[28px] sm:min-w-[32px] text-[10px] sm:text-xs"
                      style={{
                        backgroundColor:
                          dayOfWeek === 0 || dayOfWeek === 6
                            ? "#f0f0f0"
                            : "white",
                      }}
                    >
                      <div className="font-medium">{d}</div>
                      <div className="text-[9px] sm:text-[10px] font-light">
                        {daysOfWeek[dayOfWeek]}
                      </div>
                    </th>
                  );
                })}
              </tr>
              {/* /**** dodavanje reda za procente *** */}
              <tr>
                <th className="sticky left-0 bg-gray-50 border text-xs text-blue-800">
                  % Рад од куће
                </th>

                {days.map((d) => {
                  const dayOfWeek = new Date(year, month - 1, d).getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <th
                      key={`percent-${d}`}
                      className={`border text-center text-xs font-medium ${
                        isWeekend
                          ? "bg-gray-100"
                          : workFromHomePercent[d] > 30
                            ? "bg-red-200"
                            : "bg-gray-50"
                      }`}
                    >
                      {isWeekend ? "" : `${workFromHomePercent[d]}%`}
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
                  {/* <td className="sticky left-0 bg-gray-50 border w-[220px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-left text-blue-800 group-hover:bg-blue-100"> */}
                  <td className="sticky left-0 bg-gray-50 border w-[220px] min-w-[100px] max-w-[100px] px-0.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-left text-blue-800 group-hover:bg-blue-100">
                    {emp.full_name}
                  </td>
                  {days.map((d) => {
                    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const statusId = scheduleMap.get(`${emp.id}-${date}`);
                    const history = auditMap.get(`${emp.id}-${date}`) || [];
                    const status = statusMap.get(statusId);
                    const dayOfWeek = new Date(year, month - 1, d).getDay();

                    return (
                      <AuditCell
                        key={d}
                        history={history}
                        backgroundColor={
                          dayOfWeek === 0 || dayOfWeek === 6
                            ? "#f0f0f0"
                            : status?.color_hex || "transparent"
                        }
                        label={status?.label || ""}
                        code={status?.code_sr || ""}
                      />
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
