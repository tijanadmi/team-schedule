import { redirect } from "next/navigation";

import { AccessError, requireActiveEmployee } from "@/lib/access";
import NonWorkingDaysAdmin from "@/components/NonWorkingDaysAdmin";

export const dynamic = "force-dynamic";

export default async function NonWorkingDaysPage() {
  let employee;

  try {
    ({ employee } = await requireActiveEmployee());
  } catch (error) {
    if (error instanceof AccessError) {
      redirect("/login");
    }

    throw error;
  }

  if (employee.role !== "admin") {
    redirect("/");
  }

  const year = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
    }).format(new Date()),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-24 text-gray-800">
      <h1 className="mb-2 text-2xl font-semibold text-blue-800">
        Нерадни дани
      </h1>

      <p className="mb-6 text-sm text-gray-600">
        Унесите заједничке нерадне дане, па потврдите месец или целу годину.
        Суботе и недеље није потребно појединачно уносити.
      </p>

      <NonWorkingDaysAdmin initialYear={year} />
    </main>
  );
}
