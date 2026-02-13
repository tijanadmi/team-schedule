// lib/calendar.js
// lib/calendar.js

export function daysInMonth(year, month) {
  // month je 1–12
  return new Date(year, month, 0).getDate();
}

export function prevNext(year, month) {
  return {
    prev:
      month === 1
        ? { year: year - 1, month: 12 }
        : { year: year, month: month - 1 },

    next:
      month === 12
        ? { year: year + 1, month: 1 }
        : { year: year, month: month + 1 },
  };
}
