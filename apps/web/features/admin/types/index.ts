export interface AdminClientListItem {
  id: string;
  displayName: string;
  email: string;
  houseKeyPrefix: string;
  isActive: boolean;
  visibilityGroups: string[];
  pieceCount: number;
  memberClass?: string;
  accessStatus?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPieceListItem {
  id: string;
  serialNumber: string;
  pieceName?: string;
  designName: string;
  collection: string;
  collectionId?: string;
  type?: string;
  material?: string;
  currentOwner: string | null;
  status: string;
  ownership?: string;
  access?: string;
  visibilityGroups?: string[];
  updatedAt?: string;
  createdAt?: string;
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
  pieceCount?: number;
  ownerCount?: number;
  createdAt?: string;
  updatedAt?: string;
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

export interface AdminCertificateListItem {
  id: string;
  certificateNumber: string;
  isActive: boolean;
  issuedAt: string;
  pdfUrl: string | null;
  piece: { serialNumber: string; design: { name: string } };
  owner: { displayName: string } | null;
}

export interface AdminVerificationLogItem {
  id: string;
  serialNumber: string;
  result: string;
  ipAddress: string | null;
  verifiedAt: string;
  pieceId: string | null;
  clientId: string | null;
}

export interface AdminClientDetail {
  id: string;
  displayName: string;
  displayNameAr: string | null;
  email: string;
  houseKeyPrefix: string;
  isActive: boolean;
  visibilityGroups: string[];
  pieceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPieceDetail {
  id: string;
  serialNumber: string;
  designId: string;
  designName: string;
  collection: string;
  collectionId: string;
  currentOwner: string | null;
  currentOwnerId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetail {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  completedAt?: string | null;
  client: { id: string; displayName: string; email: string };
  items: Array<{
    id: string;
    piece: { id: string; serialNumber: string; design: { name: string } };
    priceAtPurchase: string | number;
  }>;
  shippingAddress?: string | null;
  notes?: string | null;
}
