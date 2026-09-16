export function formatPrice(
  amount: string | number,
  currency = "SAR",
  locale: "ar" | "en" = "en",
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const intlLocale = locale === "ar" ? "ar-SA" : "en-SA";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTransferStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function formatAdminDate(
  value?: string | Date | null,
  locale: "ar" | "en" = "en",
): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    calendar: "gregory",
  });
}
