export interface VerificationResult {
  pieceName?: string;
  serialNumber?: string;
  collection?: string;
  material?: string;
  weight?: string | number | null;
  dimensions?: string;
  issuedAt?: string | null;
  [key: string]: unknown;
}
