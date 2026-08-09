export interface ClientProfile {
  id: string;
  houseId: string;
  displayName: string;
  email?: string;
  phone?: string;
  locale?: string;
  createdAt: string;
}

export interface ProfileSummary {
  id: string;
  houseId: string;
  displayName: string;
  memberSince: string;
  ownedPiecesCount: number;
  certificatesCount: number;
  pendingTransfersCount: number;
}
