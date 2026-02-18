"use client";

import { useState, useTransition, useMemo } from "react";
import { updateWorkStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function StatusSelect({ employeeId, date, value, statuses, canEdit }) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value ?? "");

  const router = useRouter();

  // pronađi objekat statusa na osnovu izabrane vrednosti
  const selectedStatus = useMemo(() => {
    return statuses.find((s) => s.id === Number(selected));
  }, [selected, statuses]);

  const backgroundColor = selectedStatus?.color_hex || "transparent";

  async function handleChange(e) {
    if (!canEdit) return;

    const statusId = e.target.value ? Number(e.target.value) : null;
    setSelected(statusId ?? "");

    // Čekamo da se upsert završi pre refresh-a
    startTransition(async () => {
      await updateWorkStatus(employeeId, date, statusId);
      router.refresh();
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
