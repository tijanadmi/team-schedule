"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { updateWorkStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function StatusSelect({ employeeId, date, value, statuses, canEdit }) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    if (!saving.current) setSelected(value ?? "");
  }, [value]);

  const router = useRouter();

  // pronađi objekat statusa na osnovu izabrane vrednosti
  const selectedStatus = useMemo(() => {
    return statuses.find((s) => s.id === Number(selected));
  }, [selected, statuses]);

  const backgroundColor = selectedStatus?.color_hex || "transparent";

  async function handleChange(e) {
    if (!canEdit || saving.current || isPending) return;

    const statusId = e.target.value ? Number(e.target.value) : null;
    if (statusId === (selected === "" ? null : Number(selected))) return;
    const previous = selected;
    saving.current = true;
    setIsSaving(true);
    setSelected(statusId ?? "");

    const toastId = `work-status-${employeeId}-${date}`;
    toast.loading("Чување измене...", { id: toastId });
    try {
      await updateWorkStatus(employeeId, date, statusId);
      toast.success("Измена је успешно сачувана", { id: toastId });
      // React 18 requires a new transition after the asynchronous save.
      startTransition(() => router.refresh());
    } catch (err) {
      setSelected(previous);
      toast.error(err.message || "Грешка при снимању измене", { id: toastId });
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
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
        disabled={isSaving || isPending || !canEdit}
        aria-busy={isSaving || isPending}
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
