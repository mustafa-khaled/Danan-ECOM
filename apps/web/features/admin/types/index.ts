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

export interface AdminTransferDetail extends AdminTransferListItem {
  senderConfirmedAt?: string | null;
  recipientConfirmedAt?: string | null;
  completedAt?: string | null;
  dadanReviewedAt?: string | null;
  dadanReviewedBy?: { displayName: string } | null;
}

export interface AdminCollectionListItem {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description?: string | null;
  descriptionAr?: string | null;
  coverImageUrl?: string | null;
  isVisible: boolean;
  sortOrder: number;
  visibilityGroups: string[];
  designCount: number;
}

export interface AdminCollectionDetail extends AdminCollectionListItem {
  createdAt: string;
  updatedAt: string;
}

export interface AdminDesignListItem {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  collectionId: string;
  collectionName?: string;
  material: string;
  materialAr?: string | null;
  weight: string | number;
  dimensions: string;
  dimensionsAr?: string | null;
  basePrice: string | number;
  currency: string;
  imageUrls: string[];
  isActive: boolean;
  visibilityGroups: string[];
  pieceCount?: number;
}
