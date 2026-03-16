"use client";

import { useState } from "react";

export default function AuditCell({ history, backgroundColor, label, code }) {
  const [open, setOpen] = useState(false);

  const historyText = history
    .map((h) => {
      const dateTime = new Date(h.changed_at);
      const dateStr = dateTime.toLocaleDateString("sr-RS");
      const timeStr = dateTime.toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return `${dateStr} ${timeStr} - ${h.changed_by_name}
${h.old_status_label || "-"} → ${h.new_status_label || "-"}`;
    })
    .join("\n----------------\n");

  return (
    <>
      <td
        onClick={() => history.length && setOpen(true)}
        title={historyText}
        className="border w-[60px] px-1.5 py-[4px] text-center text-[10px] leading-tight cursor-pointer"
        style={{ backgroundColor }}
      >
        <span className="hidden sm:inline">{label}</span>
        <span className="inline sm:hidden">{code}</span>
      </td>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-[90vw] max-h-[70vh] overflow-auto text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold mb-2">Историја измена</div>
            <pre className="whitespace-pre-wrap text-xs">{historyText}</pre>

            <button
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded"
              onClick={() => setOpen(false)}
            >
              Затвори
            </button>
          </div>
        </div>
      )}
    </>
  );
}
