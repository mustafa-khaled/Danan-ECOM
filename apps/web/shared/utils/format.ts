export function formatPrice(amount: string | number, currency = "SAR"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTransferStatus(status: string): string {
  return status.replace(/_/g, " ");
}
