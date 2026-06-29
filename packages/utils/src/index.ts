import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export function normalizeVisibilityGroup(group: string): string {
  return group.trim().toLowerCase().replace(/\s+/g, "-");
}

export function hasVisibilityAccess(
  clientGroups: string[],
  itemGroups: string[],
): boolean {
  if (itemGroups.includes("admin-only")) {
    return false;
  }
  if (itemGroups.length === 0) {
    return true;
  }
  const normalizedClient = clientGroups.map(normalizeVisibilityGroup);
  const normalizedItem = itemGroups.map(normalizeVisibilityGroup);
  return normalizedItem.some((g) => normalizedClient.includes(g));
}

export function generateSerialNumber(
  year: number,
  collectionCode: string,
  sequence: number,
): string {
  const padded = String(sequence).padStart(6, "0");
  return `DADAN-${year}-${collectionCode.toUpperCase()}-${padded}`;
}

export function collectionCodeFromSlug(slug: string): string {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return slug.slice(0, 2).toUpperCase() || "XX";
}

export function generateCertificateNumber(year: number): string {
  const hex = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CERT-${year}-${hex}`;
}

export function createVerificationToken(
  serialNumber: string,
  certificateId: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${serialNumber}:${certificateId}`)
    .digest("hex");
}

export function verifyVerificationToken(
  serialNumber: string,
  certificateId: string,
  token: string,
  secret: string,
): boolean {
  const expected = createVerificationToken(serialNumber, certificateId, secret);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(token, "hex"),
    );
  } catch {
    return false;
  }
}

const TRANSFER_TRANSITIONS: Record<string, string[]> = {
  INITIATED: ["SENDER_CONFIRMED", "CANCELLED"],
  SENDER_CONFIRMED: ["RECIPIENT_CONFIRMED", "CANCELLED"],
  RECIPIENT_CONFIRMED: ["DADAN_REVIEW"],
  DADAN_REVIEW: ["APPROVED", "REJECTED"],
};

export function canTransitionTransfer(from: string, to: string): boolean {
  return TRANSFER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function maskDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] ?? name;
  const last = parts[parts.length - 1]!;
  return `${parts[0]} ${last[0]}.`;
}
