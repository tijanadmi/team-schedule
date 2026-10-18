// // src/app/api/dashboard-export/[year]/[month]/route.js

// export const revalidate = 0;

// import { NextResponse } from "next/server";
// import ExcelJS from "exceljs";
// import {
//   getEmployeesByOrg,
//   getStatuses,
//   getScheduleForMonthDashboard,
// } from "@/lib/data-service";
// import { daysInMonth } from "@/lib/calendar";
// import { AccessError, requireActiveEmployee } from "@/lib/access";

// const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

// export async function GET(request, { params }) {
//   try {
//     await requireActiveEmployee();
//   } catch (error) {
//     return NextResponse.json(
//       {
//         error:
//           error instanceof AccessError
//             ? error.message
//             : "Не могу да проверим право приступа.",
//       },
//       {
//         status: error instanceof AccessError ? error.status : 500,
//       },
//     );
//   }

//   const year = Number(params.year);
//   const month = Number(params.month);

//   const dim = daysInMonth(year, month);
//   const days = Array.from({ length: dim }, (_, i) => i + 1);

//   const [employees = [], statuses = [], schedule = []] = await Promise.all([
//     getEmployeesByOrg(year, month),
//     getStatuses(),
//     getScheduleForMonthDashboard(year, month),
//   ]);

//   const orgPrefix =
//     employees.length > 0 ? employees[0].org.substring(0, 4) : "ORG";

//   employees.sort((a, b) => a.org.localeCompare(b.org));

//   const statusMap = new Map();
//   statuses.forEach((s) => statusMap.set(s.id, s));

//   const scheduleMap = new Map();
//   schedule.forEach((r) => {
//     scheduleMap.set(`${r.user_id}-${r.work_date}`, r.status_id);
//   });

//   const workbook = new ExcelJS.Workbook();
//   // const worksheet = workbook.addWorksheet(
//   //   `SRTS-${String(month).padStart(2, "0")}-${year}`,
//   // );
//   const worksheet = workbook.addWorksheet(
//     `${orgPrefix}-${String(month).padStart(2, "0")}-${year}`,
//   );

//   // =====================
//   // HEADER
//   // =====================

//   const headerRow = ["Запослени"];

//   days.forEach((d) => {
//     const dayOfWeek = new Date(year, month - 1, d).getDay();
//     headerRow.push(`${d} ${daysOfWeek[dayOfWeek]}`);
//   });

//   worksheet.addRow(headerRow);

//   const header = worksheet.getRow(1);
//   header.font = { bold: true };
//   header.alignment = { vertical: "middle", horizontal: "center" };

//   // =====================
//   // DATA
//   // =====================

//   employees.forEach((emp) => {
//     const row = [emp.full_name];

//     days.forEach((d) => {
//       const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
//       const statusId = scheduleMap.get(`${emp.id}-${date}`);
//       const status = statusMap.get(statusId);

//       row.push(status?.label || "");
//     });

//     worksheet.addRow(row);
//   });

//   // =====================
//   // STILOVANJE ĆELIJA
//   // =====================

//   worksheet.eachRow((row, rowNumber) => {
//     row.eachCell((cell, colNumber) => {
//       // preskoči prvu kolonu (ime zaposlenog)
//       // if (colNumber === 1) return;

//       const dayIndex = colNumber - 2; // jer prva kolona je zaposleni
//       const day = days[dayIndex];
//       // const dayOfWeek = new Date(year, month - 1, day).getDay();
//       const dayOfWeek =
//         colNumber > 1 ? new Date(year, month - 1, day).getDay() : null;

//       const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

//       // HEADER vikend siva
//       if (rowNumber === 1 && isWeekend) {
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFEFEFEF" },
//         };
//       }

//       // DATA redovi
//       // if (rowNumber > 1) {
//       //   const statusLabel = cell.value;

//       if (rowNumber > 1 && colNumber > 1) {
//         // nađi status po labeli
//         // const status = statuses.find((s) => s.label === statusLabel);
//         const statusLabel = cell.value;

//         // if (status?.color_hex) {
//         //   cell.fill = {
//         //     type: "pattern",
//         //     pattern: "solid",
//         //     fgColor: {
//         //       argb: `FF${status.color_hex.replace("#", "")}`,
//         //     },
//         //   };
//         // }
//         if (statusLabel) {
//           const status = statuses.find((s) => s.label === statusLabel);
//           if (status?.color_hex) {
//             cell.fill = {
//               type: "pattern",
//               pattern: "solid",
//               fgColor: {
//                 argb: `FF${status.color_hex.replace("#", "")}`,
//               },
//             };
//           }
//         } else {
//           // prazno polje = svetlo sivo
//           cell.fill = {
//             type: "pattern",
//             pattern: "solid",
//             fgColor: { argb: "FFF5F5F5" },
//           };
//         }

//         // vikend uvek siv (override)
//         if (isWeekend) {
//           cell.fill = {
//             type: "pattern",
//             pattern: "solid",
//             fgColor: { argb: "FFEFEFEF" },
//           };
//         }
//       }

//       // =========================
//       // ALIGNMENT
//       // =========================

//       cell.alignment = {
//         vertical: "middle",
//         horizontal: "center",
//         wrapText: true,
//       };

//       // =========================
//       // BORDER
//       // =========================

//       if (rowNumber === 1) {
//         // ceo header red – jači border
//         cell.border = {
//           top: { style: "medium" },
//           left: { style: "medium" },
//           bottom: { style: "medium" },
//           right: { style: "medium" },
//         };
//       } else {
//         // ostali redovi – tanak
//         cell.border = {
//           top: { style: "thin" },
//           left: { style: "thin" },
//           bottom: { style: "thin" },
//           right: { style: "thin" },
//         };
//       }
//     });
//   });

//   // =====================
//   // PODEŠAVANJE KOLONA
//   // =====================

//   worksheet.columns.forEach((column, index) => {
//     column.width = index === 0 ? 25 : 15;
//   });

//   // Zamrzni prvu kolonu i header
//   worksheet.views = [
//     {
//       state: "frozen",
//       xSplit: 1,
//       ySplit: 1,
//     },
//   ];

//   const buffer = await workbook.xlsx.writeBuffer();

//   return new NextResponse(buffer, {
//     headers: {
//       "Content-Type":
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       // "Content-Disposition": `attachment; filename=Evidencija_SRTS-${String(month).padStart(2, "0")}-${year}.xlsx`,
//       "Content-Disposition": `attachment; filename=Evidencija_${orgPrefix}-${String(month).padStart(2, "0")}-${year}.xlsx`,
//     },
//   });
// }

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import {
  getEmployeesByOrg,
  getStatuses,
  getScheduleForMonthDashboard,
} from "@/lib/data-service";

import { AccessError, requireActiveEmployee } from "@/lib/access";
import { getWorkCalendar } from "@/lib/work-calendar-service";
import {
  getMonthBounds,
  buildCalendarDays,
  calculateRemotePercent,
} from "@/lib/work-calendar";

export const revalidate = 0;

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

function applyFill(cell, color) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: `FF${color.replace("#", "")}`,
    },
  };
}

export async function GET(request, { params }) {
  try {
    await requireActiveEmployee();

    const year = Number(params.year);
    const month = Number(params.month);

    try {
      getMonthBounds(year, month);
    } catch {
      return NextResponse.json(
        { error: "Неисправна година или месец." },
        { status: 400 },
      );
    }

    const [employees = [], statuses = [], schedule = [], workCalendar] =
      await Promise.all([
        getEmployeesByOrg(year, month),
        getStatuses(),
        getScheduleForMonthDashboard(year, month),
        getWorkCalendar(year, month),
      ]);

    employees.sort((a, b) => a.org.localeCompare(b.org));

    const calendarDays = buildCalendarDays(year, month, workCalendar.holidays);

    const statusMap = new Map(statuses.map((status) => [status.id, status]));

    const scheduleMap = new Map(
      schedule.map((item) => [
        `${item.user_id}-${item.work_date}`,
        item.status_id,
      ]),
    );

    const percentages = calculateRemotePercent(
      employees,
      statusMap,
      scheduleMap,
      calendarDays,
      workCalendar.confirmed,
    );

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet(
      `Евиденција-${year}-${String(month).padStart(2, "0")}`,
    );

    worksheet.addRow([
      "Запослени",
      ...calendarDays.map(
        (dayInfo) => `${dayInfo.day} ${daysOfWeek[dayInfo.weekday]}`,
      ),
    ]);

    worksheet.addRow([
      "% Рад од куће",
      ...calendarDays.map((dayInfo) => {
        const percent = percentages[dayInfo.day];
        return percent === null ? "—" : percent / 100;
      }),
    ]);

    for (const employee of employees) {
      worksheet.addRow([
        employee.full_name,
        ...calendarDays.map((dayInfo) => {
          const statusId = scheduleMap.get(`${employee.id}-${dayInfo.date}`);

          return statusMap.get(statusId)?.label || "";
        }),
      ]);
    }

    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      for (
        let colNumber = 1;
        colNumber <= calendarDays.length + 1;
        colNumber++
      ) {
        const cell = row.getCell(colNumber);

        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "center",
          wrapText: true,
        };

        const borderStyle = rowNumber === 1 ? "medium" : "thin";

        cell.border = {
          top: { style: borderStyle },
          left: { style: borderStyle },
          bottom: { style: borderStyle },
          right: { style: borderStyle },
        };

        if (rowNumber <= 2) {
          cell.font = { bold: true };
        }

        if (colNumber === 1) continue;

        const dayInfo = calendarDays[colNumber - 2];
        let backgroundColor = dayInfo.backgroundColor;
        const notes = [];

        if (!workCalendar.confirmed) {
          notes.push("Календар месеца није потврђен.");
        }

        if (dayInfo.reason) {
          notes.push(dayInfo.reason);
        }

        if (rowNumber === 2) {
          const percent = percentages[dayInfo.day];

          if (percent !== null) {
            cell.numFmt = "0%";
          }

          backgroundColor =
            backgroundColor ||
            (percent !== null && percent > 30 ? "#fecaca" : "#f9fafb");
        }

        if (rowNumber >= 3) {
          const employee = employees[rowNumber - 3];
          const statusId = scheduleMap.get(`${employee.id}-${dayInfo.date}`);

          const status = statusMap.get(statusId);

          backgroundColor = backgroundColor || status?.color_hex || "#f5f5f5";

          if (dayInfo.isNonWorking && statusId != null) {
            notes.push(
              "Постојећи статус на нерадном дану — потребна је провера.",
            );

            cell.value = `${status?.label || "Статус"} ⚠`;
          }
        }

        if (backgroundColor) {
          applyFill(cell, backgroundColor);
        }

        if (notes.length > 0) {
          cell.note = notes.join("\n");
        }
      }
    }

    worksheet.columns.forEach((column, index) => {
      column.width = index === 0 ? 28 : 15;
    });

    worksheet.views = [
      {
        state: "frozen",
        xSplit: 1,
        ySplit: 2,
      },
    ];

    const calendarSheet = workbook.addWorksheet("Календар");

    calendarSheet.addRow(["Година", year]);
    calendarSheet.addRow(["Месец", month]);
    calendarSheet.addRow([
      "Календар",
      workCalendar.confirmed ? "Потврђен" : "НИЈЕ ПОТВРЂЕН",
    ]);
    calendarSheet.addRow([
      "Напомена",
      "Суботе и недеље су нерадне. Постојеће евиденције нису обрисане.",
    ]);
    calendarSheet.addRow([]);
    calendarSheet.addRow(["Датум", "Нерадни дан"]);

    for (const holiday of workCalendar.holidays) {
      calendarSheet.addRow([holiday.date, holiday.name]);
    }

    calendarSheet.getColumn(1).width = 20;
    calendarSheet.getColumn(2).width = 65;

    calendarSheet.eachRow((row) => {
      row.alignment = {
        vertical: "top",
        wrapText: true,
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Evidencija-${year}-${String(month).padStart(2, "0")}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Excel export failed:", error);

    return NextResponse.json(
      { error: "Excel извештај није могао бити генерисан." },
      { status: 500 },
    );
  }
}
