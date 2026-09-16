export type OwnershipRecordStatus =
  | "OWNED"
  | "IN_TRANSFER"
  | "PENDING"
  | "AVAILABLE";

export type OwnershipRecordTransferType =
  | "DIRECT"
  | "SECONDARY"
  | "GIFT"
  | "INHERITED"
  | "NONE";

export interface OwnershipRecordItem {
  id: string;
  pieceId: string;
  pieceName: string;
  pieceNameAr?: string | null;
  pieceSerial: string;
  pieceImageUrl?: string;
  ownerName: string;
  ownerEmail: string;
  ownerId?: string;
  ownerAvatarUrl?: string;
  collectionName: string;
  collectionNameAr?: string | null;
  status: OwnershipRecordStatus;
  transferType: OwnershipRecordTransferType;
  since: string;
}
