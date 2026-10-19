import "server-only";

import { redirect } from "next/navigation";
import { AccessError, requireActiveEmployee } from "@/lib/access";

export async function requirePageAccess() {
  try {
    return await requireActiveEmployee();
  } catch (error) {
    if (
      error instanceof AccessError &&
      (error.status === 401 || error.status === 403)
    ) {
      redirect("/login");
    }

    // Privremene greške servisa ne tretiramo kao odjavu.
    throw error;
  }
}
