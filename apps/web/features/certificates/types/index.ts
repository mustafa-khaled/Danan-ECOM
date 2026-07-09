export interface CertificateData {
  certificateNumber: string;
  issuedAt: string;
  pdfUrl?: string | null;
  qrCodeData?: string | null;
}
