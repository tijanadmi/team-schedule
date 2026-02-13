"use client";

import { useState, useTransition, useMemo } from "react";
import { updateWorkStatus } from "@/lib/actions";

export function StatusSelect({ employeeId, date, value, statuses, canEdit }) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value ?? "");

  // pronađi objekat statusa na osnovu izabrane vrednosti
  const selectedStatus = useMemo(() => {
    return statuses.find((s) => s.id === Number(selected));
  }, [selected, statuses]);

  const backgroundColor = selectedStatus?.color_hex || "transparent";

  function handleChange(e) {
    if (!canEdit) return;

    const statusId = e.target.value ? Number(e.target.value) : null;
    setSelected(statusId ?? "");

    startTransition(() => {
      updateWorkStatus(employeeId, date, statusId);
    });
  }

  return (
    <div
      style={{
        backgroundColor,
        borderRadius: "4px",
        padding: "2px",
        transition: "background-color 0.2s ease",
      }}
    >
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending || !canEdit}
        className="w-full bg-transparent text-xs sm:text-sm focus:outline-none"
      >
        <option value="">—</option>
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
