// src/app/api/dashboard-export/[year]/[month]/route.js

export const revalidate = 0;

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import {
  getEmployees,
  getStatuses,
  getScheduleForMonthDashboard,
} from "@/lib/data-service";
import { daysInMonth } from "@/lib/calendar";

const daysOfWeek = ["Нед.", "Пон.", "Уто.", "Сре.", "Чет.", "Пет.", "Суб."];

export async function GET(request, { params }) {
  const year = Number(params.year);
  const month = Number(params.month);

  const dim = daysInMonth(year, month);
  const days = Array.from({ length: dim }, (_, i) => i + 1);

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

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    `SRTS-${String(month).padStart(2, "0")}-${year}`,
  );

  // =====================
  // HEADER
  // =====================

  const headerRow = ["Запослени"];

  days.forEach((d) => {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    headerRow.push(`${d} ${daysOfWeek[dayOfWeek]}`);
  });

  worksheet.addRow(headerRow);

  const header = worksheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "center" };

  // =====================
  // DATA
  // =====================

  employees.forEach((emp) => {
    const row = [emp.full_name];

    days.forEach((d) => {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const statusId = scheduleMap.get(`${emp.id}-${date}`);
      const status = statusMap.get(statusId);

      row.push(status?.label || "");
    });

    worksheet.addRow(row);
  });

  // =====================
  // STILOVANJE ĆELIJA
  // =====================

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      // preskoči prvu kolonu (ime zaposlenog)
      // if (colNumber === 1) return;

      const dayIndex = colNumber - 2; // jer prva kolona je zaposleni
      const day = days[dayIndex];
      // const dayOfWeek = new Date(year, month - 1, day).getDay();
      const dayOfWeek =
        colNumber > 1 ? new Date(year, month - 1, day).getDay() : null;

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // HEADER vikend siva
      if (rowNumber === 1 && isWeekend) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFEFEF" },
        };
      }

      // DATA redovi
      // if (rowNumber > 1) {
      //   const statusLabel = cell.value;

      if (rowNumber > 1 && colNumber > 1) {
        // nađi status po labeli
        // const status = statuses.find((s) => s.label === statusLabel);
        const statusLabel = cell.value;

        // if (status?.color_hex) {
        //   cell.fill = {
        //     type: "pattern",
        //     pattern: "solid",
        //     fgColor: {
        //       argb: `FF${status.color_hex.replace("#", "")}`,
        //     },
        //   };
        // }
        if (statusLabel) {
          const status = statuses.find((s) => s.label === statusLabel);
          if (status?.color_hex) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: `FF${status.color_hex.replace("#", "")}`,
              },
            };
          }
        } else {
          // prazno polje = svetlo sivo
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }

        // vikend uvek siv (override)
        if (isWeekend) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEFEFEF" },
          };
        }
      }

      // =========================
      // ALIGNMENT
      // =========================

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      // =========================
      // BORDER
      // =========================

      if (rowNumber === 1) {
        // ceo header red – jači border
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
      } else {
        // ostali redovi – tanak
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });
  });

  // =====================
  // PODEŠAVANJE KOLONA
  // =====================

  worksheet.columns.forEach((column, index) => {
    column.width = index === 0 ? 25 : 15;
  });

  // Zamrzni prvu kolonu i header
  worksheet.views = [
    {
      state: "frozen",
      xSplit: 1,
      ySplit: 1,
    },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=Evidencija_SRTS-${String(month).padStart(2, "0")}-${year}.xlsx`,
    },
  });
}
