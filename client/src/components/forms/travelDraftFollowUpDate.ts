export function followUpDateToInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function followUpInputToDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatFollowUpDate(value: Date | string | null | undefined) {
  const inputValue = followUpDateToInput(value);
  if (!inputValue) return "";
  return new Date(`${inputValue}T12:00:00`).toLocaleDateString("pt-BR");
}
