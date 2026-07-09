export interface VerificationResult {
  pieceName?: string;
  serialNumber?: string;
  collection?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
  [key: string]: unknown;
}
