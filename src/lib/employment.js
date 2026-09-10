export function isEmployedOnDate(employee, date) {
  if (!employee) return false;

  const start = employee.employment_start_date;
  const end = employee.employment_end_date;

  return (!start || date >= start) && (!end || date <= end);
}
