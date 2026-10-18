import "server-only";

const fixedNames = {
  "01-01": "Нова година",
  "01-02": "Нова година",
  "01-07": "Божић",
  "02-15": "Сретење — Дан државности",
  "02-16": "Сретење — Дан државности",
  "05-01": "Празник рада",
  "05-02": "Празник рада",
  "11-11": "Дан примирја",
};

const stateHolidaySuffixes = [
  "01-01",
  "01-02",
  "02-15",
  "02-16",
  "05-01",
  "05-02",
  "11-11",
];

function dateObject(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date, count) {
  const value = dateObject(date);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function isWeekend(date) {
  const day = dateObject(date).getUTCDay();
  return day === 0 || day === 6;
}

export async function fetchSerbianHolidays(year) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Неисправна година.");
  }

  const response = await fetch(
    `https://nagerholidays.com/api/v4/Holidays/RS/${year}`,
    {
      cache: "no-store",
      redirect: "error",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!response.ok) {
    throw new Error(`Сервис празника није доступан за ${year}. годину.`);
  }

  const source = await response.json();

  if (!Array.isArray(source) || source.length === 0 || source.length > 100) {
    throw new Error("Сервис је вратио неисправну листу празника.");
  }

  const holidays = new Map();
  let easterSunday = null;

  function add(date, name) {
    const names = holidays.get(date) || new Set();
    names.add(name);
    holidays.set(date, names);
  }

  for (const item of source) {
    if (
      !item ||
      typeof item.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      !item.date.startsWith(`${year}-`) ||
      item.countryCode !== "RS" ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 200
    ) {
      throw new Error("Сервис је вратио неисправан податак.");
    }

    const parsed = dateObject(item.date);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== item.date
    ) {
      throw new Error("Сервис је вратио неисправан датум.");
    }

    if (
      item.nationalHoliday !== true ||
      !Array.isArray(item.holidayTypes) ||
      !item.holidayTypes.includes("Public")
    ) {
      continue;
    }

    const englishName = item.name.toLowerCase();

    const isEaster =
      englishName.includes("easter") || englishName.includes("good friday");

    const name = isEaster
      ? "Васкршњи празници"
      : fixedNames[item.date.slice(5)] || item.name.trim();

    add(item.date, name);

    if (englishName.includes("easter") && parsed.getUTCDay() === 0) {
      if (easterSunday && easterSunday !== item.date) {
        throw new Error("Сервис је вратио неусаглашене датуме Васкрса.");
      }

      easterSunday = item.date;
    }
  }

  // Ne prihvataj očigledno nepotpun godišnji odgovor.
  for (const suffix of Object.keys(fixedNames)) {
    if (!holidays.has(`${year}-${suffix}`)) {
      throw new Error(
        "Годишња листа празника није потпуна. Покушајте касније.",
      );
    }
  }

  if (!easterSunday) {
    throw new Error("У одговору недостаје датум Васкрса.");
  }

  const easterDates = new Set();

  // Veliki petak, subota, nedelja i ponedeljak.
  for (let offset = -2; offset <= 1; offset++) {
    const date = addDays(easterSunday, offset);
    easterDates.add(date);
    add(date, "Васкршњи празници");
  }

  const fixedDates = new Set(
    Object.keys(fixedNames).map((suffix) => `${year}-${suffix}`),
  );

  // Prenos državnog praznika koji pada u nedelju.
  // Verske praznike ne prenosimo.
  for (const suffix of stateHolidaySuffixes) {
    const original = `${year}-${suffix}`;

    if (dateObject(original).getUTCDay() !== 0) continue;

    let observed = addDays(original, 1);

    while (
      isWeekend(observed) ||
      fixedDates.has(observed) ||
      easterDates.has(observed)
    ) {
      observed = addDays(observed, 1);
    }

    // Ako ga je API već vratio, ne pravimo duplikat.
    if (!holidays.has(observed)) {
      add(observed, `${fixedNames[suffix]} — пренети дан`);
    }
  }

  return [...holidays.entries()]
    .map(([date, names]) => ({
      date,
      name: [...names].join(" / "),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
