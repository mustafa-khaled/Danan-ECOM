export interface AdminClientListItem {
  id: string;
  displayName: string;
  email: string;
  houseKeyPrefix: string;
  isActive: boolean;
  visibilityGroups: string[];
  pieceCount: number;
}

export interface AdminPieceListItem {
  id: string;
  serialNumber: string;
  designName: string;
  collection: string;
  currentOwner: string | null;
  status: string;
}

export interface AdminOrderListItem {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  client: { displayName: string; email: string };
  items: Array<{ piece: { serialNumber: string } }>;
}

export interface AdminTransferListItem {
  id: string;
  status: string;
  transferType: string;
  initiatedAt: string;
  needsReview?: boolean;
  piece: { serialNumber: string; design: { name: string; imageUrls: string[] } };
  fromClient: { displayName: string; email: string };
  toClient: { displayName: string; email: string };
}
