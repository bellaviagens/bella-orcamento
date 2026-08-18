export function parseBrazilianCurrencyInput(value: string): number {
  const sanitized = value.replace(/[^\d.,]/g, "");
  if (!sanitized) return 0;

  if (sanitized.includes(",")) {
    return Number.parseFloat(sanitized.replace(/\./g, "").replace(",", ".")) || 0;
  }

  const parts = sanitized.split(".");
  const normalized = parts.length === 2 && parts[1].length <= 2
    ? sanitized
    : sanitized.replace(/\./g, "");
  return Number.parseFloat(normalized) || 0;
}

export function formatBrazilianCurrencyInput(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
