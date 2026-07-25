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
