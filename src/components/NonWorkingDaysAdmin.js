"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  confirmCalendar,
  loadCalendarYear,
  previewSerbianHolidays,
} from "@/lib/calendar-actions";

const monthNames = [
  "Јануар",
  "Фебруар",
  "Март",
  "Април",
  "Мај",
  "Јун",
  "Јул",
  "Август",
  "Септембар",
  "Октобар",
  "Новембар",
  "Децембар",
];

function monthOf(date) {
  return Number(date.slice(5, 7));
}

function normalized(days) {
  return JSON.stringify(
    [...days]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ date, name }) => ({ date, name: name.trim() })),
  );
}

export default function NonWorkingDaysAdmin({ initialYear }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(1);

  const [calendar, setCalendar] = useState(null);
  const [days, setDays] = useState([]);

  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(false);
  const [showWholeYear, setShowWholeYear] = useState(false);

  const importLock = useRef(false);

  const busy = saving || importing;

  const [error, setError] = useState("");

  const saveLock = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setCalendar(null);
      setDays([]);

      try {
        const result = await loadCalendarYear(year);

        if (cancelled) return;

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setCalendar(result.calendar);
        setDays(result.calendar.days);
      } catch {
        if (!cancelled) {
          setError("Календар није могао бити учитан.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [year]);

  const dirty =
    calendar !== null && normalized(days) !== normalized(calendar.days);

  useEffect(() => {
    function preventClose(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    if (dirty) window.addEventListener("beforeunload", preventClose);

    return () => {
      window.removeEventListener("beforeunload", preventClose);
    };
  }, [dirty]);

  const visibleDays = [...days]
    .filter((day) => showWholeYear || monthOf(day.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date));

  const confirmation = calendar?.months.find((item) => item.month === month);

  const monthDirty =
    calendar !== null &&
    normalized(days.filter((day) => monthOf(day.date) === month)) !==
      normalized(calendar.days.filter((day) => monthOf(day.date) === month));

  const confirmedCount = calendar?.months.length || 0;

  function changeYear(value) {
    const nextYear = Number(value);

    if (
      dirty &&
      !window.confirm(
        "Постоје несачуване измене. Промена године ће их одбацити. Наставити?",
      )
    ) {
      return;
    }

    setYear(nextYear);
    setNewDate("");
    setNewName("");
  }

  function addDay(event) {
    event.preventDefault();

    if (!newDate || !newDate.startsWith(`${year}-`) || !newName.trim()) {
      toast.error("Унесите датум из изабране године и назив.");
      return;
    }

    if (days.some((day) => day.date === newDate)) {
      toast.error("Овај датум је већ на листи.");
      return;
    }

    setDays((current) => [...current, { date: newDate, name: newName.trim() }]);

    setMonth(monthOf(newDate));
    setNewDate("");
    setNewName("");
  }

  async function importHolidays(scopeMonth) {
    if (importLock.current || saveLock.current || loading || !calendar) {
      return;
    }

    importLock.current = true;
    setImporting(true);

    const toastId = "holiday-import";

    try {
      toast.loading("Преузимање празника...", { id: toastId });

      const result = await previewSerbianHolidays(year);

      if (!result.ok) throw new Error(result.error);

      const imported =
        scopeMonth === null
          ? result.days
          : result.days.filter((day) => monthOf(day.date) === scopeMonth);

      // Dodaj datume koji nedostaju.
      // Sačuvaj postojeće ručne dopune i izmenjene nazive.
      setDays((current) => {
        const merged = new Map(current.map((day) => [day.date, day]));

        for (const day of imported) {
          if (!merged.has(day.date)) {
            merged.set(day.date, day);
          }
        }

        return [...merged.values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
      });

      setShowWholeYear(scopeMonth === null);

      toast.success(
        `Преузето ${imported.length} датума. Прегледајте листу и потврдите је.`,
        { id: toastId },
      );
    } catch (err) {
      toast.error(err.message || "Преузимање није успело.", { id: toastId });
    } finally {
      importLock.current = false;
      setImporting(false);
    }
  }

  async function save(scopeMonth) {
    if (saveLock.current || importLock.current || loading || !calendar) {
      return;
    }

    // Posle uspešnog čuvanja učitavamo sveže stanje cele godine.
    // Zato ne odbacujemo neprimetno izmene iz drugih meseci.
    // if (scopeMonth !== null) {
    //   const otherDraftDays = days.filter(
    //     (day) => monthOf(day.date) !== scopeMonth,
    //   );

    //   const otherSavedDays = calendar.days.filter(
    //     (day) => monthOf(day.date) !== scopeMonth,
    //   );

    //   if (normalized(otherDraftDays) !== normalized(otherSavedDays)) {
    //     toast.error(
    //       "Имате измене и у другим месецима. Потврдите целу годину или прво вратите те измене.",
    //     );
    //     return;
    //   }
    // }

    if (days.some((day) => !day.name.trim())) {
      toast.error("Сваки нерадни датум мора имати назив.");
      return;
    }

    const scopeLabel =
      scopeMonth === null
        ? `целу ${year}. годину, укључујући месеце без празника`
        : `${monthNames[scopeMonth - 1]} ${year}`;

    if (
      !window.confirm(
        `Потврдити ${scopeLabel}? Проверите да листа садржи све нерадне датуме за тај период.`,
      )
    ) {
      return;
    }

    saveLock.current = true;
    setSaving(true);

    const toastId = "calendar-save";

    try {
      toast.loading("Чување календара...", { id: toastId });

      const payload = {
        year,
        month: scopeMonth,
        days:
          scopeMonth === null
            ? days
            : days.filter((day) => monthOf(day.date) === scopeMonth),
        expected: Object.fromEntries(
          calendar.months.map((item) => [String(item.month), item.revision]),
        ),
      };

      let result = await confirmCalendar(payload);

      if (!result.ok) throw new Error(result.error);

      if (result.needsConfirmation) {
        toast.dismiss(toastId);

        const accepted = window.confirm(
          `На новим нерадним датумима постоји ${result.existingRecords} записа евиденције. Они неће бити обрисани. Да ли ипак потврђујете календар?`,
        );

        if (!accepted) return;

        toast.loading("Чување календара...", { id: toastId });

        result = await confirmCalendar({
          ...payload,
          acceptExisting: true,
        });

        if (!result.ok) throw new Error(result.error);
      }

      // Upis je završen. Učitaj nove revizije i potvrde.
      const fresh = await loadCalendarYear(year);

      if (!fresh.ok) {
        setCalendar(null);
        setError(
          "Календар је сачуван, али поновно учитавање није успело. Освежите страницу.",
        );
        toast.error("Сачувано је. Освежите страницу да учитате ново стање.", {
          id: toastId,
        });
        return;
      }

      //   setCalendar(fresh.calendar);
      //   setDays(fresh.calendar.days);
      if (scopeMonth === null) {
        setCalendar(fresh.calendar);
        setDays(fresh.calendar.days);
      } else {
        const savedMonthDays = fresh.calendar.days.filter(
          (day) => monthOf(day.date) === scopeMonth,
        );

        // Osveži sačuvano stanje samo potvrđenog meseca.
        // Ostali meseci zadržavaju ranije učitane revizije,
        // tako da provera konkurentnih izmena ostaje ispravna.
        setCalendar((current) => ({
          ...current,
          days: [
            ...current.days.filter((day) => monthOf(day.date) !== scopeMonth),
            ...savedMonthDays,
          ],
          months: [
            ...current.months.filter((item) => item.month !== scopeMonth),
            ...fresh.calendar.months.filter(
              (item) => item.month === scopeMonth,
            ),
          ],
        }));

        // Sačuvaj nepotvrđeni nacrt ostalih meseci na ekranu.
        setDays((current) => [
          ...current.filter((day) => monthOf(day.date) !== scopeMonth),
          ...savedMonthDays,
        ]);
      }

      toast.success(
        scopeMonth === null
          ? "Потврђена је цела година."
          : "Месец је потврђен.",
        { id: toastId },
      );
    } catch (err) {
      toast.error(
        err.message ||
          "Чување није успело. Проверите стање пре поновног покушаја.",
        { id: toastId },
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow-sm">
        <label className="text-sm font-medium">
          Година
          <select
            value={year}
            onChange={(event) => changeYear(event.target.value)}
            disabled={loading || busy}
            className="mt-1 block rounded border bg-white px-3 py-2"
          >
            {Array.from({ length: 101 }, (_, index) => 2000 + index).map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="text-sm font-medium">
          Месец
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            disabled={loading || busy}
            className="mt-1 block rounded border bg-white px-3 py-2"
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {calendar && (
          <p className="pb-2 text-sm text-gray-600">
            Потврђено месеци: {confirmedCount}/12
          </p>
        )}
      </div>

      {loading && <p>Учитавање календара...</p>}

      {error && (
        <p role="alert" className="rounded bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {!loading && calendar && (
        <>
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              Преузмите празнике за изабрану годину или месец. Преузимање
              попуњава листу; подаци се чувају тек након потврде.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => importHolidays(null)}
                className="rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-50"
              >
                Преузми целу {year}. годину
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => importHolidays(month)}
                className="rounded border border-blue-800 px-4 py-2 text-blue-800 disabled:opacity-50"
              >
                Преузми изабрани месец
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showWholeYear}
                disabled={busy}
                onChange={(event) => setShowWholeYear(event.target.checked)}
              />
              Прикажи листу за целу годину
            </label>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="font-medium">
              {monthNames[month - 1]} {year}:{" "}
              {confirmation ? "Потврђен" : "Није потврђен"}
            </p>

            {confirmation && (
              <p className="mt-1 text-sm text-gray-600">
                Последња потврда:{" "}
                {new Date(confirmation.confirmed_at).toLocaleString("sr-RS", {
                  timeZone: "Europe/Belgrade",
                })}
              </p>
            )}

            {monthDirty && (
              <p className="mt-2 text-sm text-amber-700">
                Постоје непотврђене измене овог месеца. До чувања важи претходни
                календар.
              </p>
            )}
          </div>

          <form
            onSubmit={addDay}
            className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm"
          >
            <label className="text-sm font-medium">
              Датум
              <input
                type="date"
                value={newDate}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                required
                disabled={busy}
                onChange={(event) => setNewDate(event.target.value)}
                className="mt-1 block rounded border bg-white px-3 py-2"
              />
            </label>

            <label className="min-w-48 flex-1 text-sm font-medium">
              Назив нерадног дана
              <input
                value={newName}
                maxLength={200}
                required
                disabled={busy}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Назив празника или другог нерадног дана"
                className="mt-1 block w-full rounded border bg-white px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-50"
            >
              Додај на листу
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Датум</th>
                  <th className="p-3">Назив</th>
                  <th className="p-3">Радња</th>
                </tr>
              </thead>

              <tbody>
                {visibleDays.map((day) => (
                  <tr key={day.date} className="border-t">
                    <td className="whitespace-nowrap p-3">
                      {day.date.split("-").reverse().join(".")}.
                    </td>

                    <td className="p-3">
                      <input
                        aria-label={`Назив за ${day.date}`}
                        value={day.name}
                        maxLength={200}
                        disabled={busy}
                        onChange={(event) => {
                          const name = event.target.value;

                          setDays((current) =>
                            current.map((item) =>
                              item.date === day.date ? { ...item, name } : item,
                            ),
                          );
                        }}
                        className="w-full min-w-48 rounded border px-3 py-2"
                      />
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setDays((current) =>
                            current.filter((item) => item.date !== day.date),
                          )
                        }
                        className="text-red-700 disabled:opacity-50"
                      >
                        Уклони
                      </button>
                    </td>
                  </tr>
                ))}

                {visibleDays.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-gray-600">
                      Нема унетих празника за овај месец. Можете га потврдити
                      ако су нерадне само суботе и недеље.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => save(month)}
              className="rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-50"
            >
              Потврди месец
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => save(null)}
              className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
            >
              Потврди целу годину
            </button>

            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() => {
                if (
                  window.confirm("Одбацити све несачуване измене ове године?")
                ) {
                  setDays(calendar.days);
                }
              }}
              className="rounded border border-gray-400 px-4 py-2 disabled:opacity-50"
            >
              Одбаци измене
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Додавање, измена назива и уклањање са листе чувају се тек након
            потврде. Пре одласка са странице потврдите или одбаците измене.
          </p>
        </>
      )}
    </div>
  );
}
