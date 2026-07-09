export interface WardrobePiece {
  id: string;
  serialNumber: string;
  status: string;
  design: {
    name: string;
    images: string[];
    collection: string;
  };
  activeTransfer?: {
    id: string;
  };
  ownershipHistory?: Array<{
    acquiredAt: string;
    acquisitionType: string;
  }>;
}
