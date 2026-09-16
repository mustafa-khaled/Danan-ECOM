export interface AdminClass {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  clientCount?: number;
  collectionCount?: number;
}

export interface AdminClientListItem {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  houseKeyPrefix: string;
  isActive: boolean;
  class?: AdminClass;
  pieceCount: number;
  memberClass?: string;
  accessStatus?: string;
  joinedAt?: string;
  createdAt?: string;
  lastSeenAt?: string | null;
  updatedAt?: string;
}

export interface AdminPieceListItem {
  id: string;
  serialNumber: string;
  name: string;
  nameAr?: string | null;
  collection: string;
  collectionAr?: string | null;
  collectionId?: string;
  material?: string;
  materialAr?: string | null;
  currentOwner: string | null;
  status: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface AdminOrderListItem {
  id: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  client: { displayName: string; email: string };
  items: Array<{ piece: { serialNumber: string; name?: string; nameAr?: string | null } }>;
}

export interface AdminTransferListItem {
  id: string;
  status: string;
  transferType: string;
  initiatedAt: string;
  needsReview?: boolean;
  piece: { serialNumber: string; name?: string; nameAr?: string | null; mainImageUrl?: string | null };
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
  classes?: AdminClass[];
  pieceCount?: number;
  ownerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCollectionDetail extends AdminCollectionListItem {
  createdAt: string;
  updatedAt: string;
  stats?: { pieceCount: number; ownerCount: number; transferCount: number };
  health?: {
    hasCover: boolean;
    hasPieces: boolean;
    hasAccessRules: boolean;
  };
}

export interface AdminCertificateListItem {
  id: string;
  certificateNumber: string;
  isActive: boolean;
  issuedAt: string;
  pdfUrl: string | null;
  piece: { serialNumber: string; name?: string; nameAr?: string | null };
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
  email: string;
  phone?: string | null;
  houseId?: string;
  houseKeyPrefix: string;
  isActive: boolean;
  class?: AdminClass;
  pieceCount: number;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string | null;
  ownedPieces?: Array<{
    id: string;
    name: string;
    nameAr?: string | null;
    serialNumber: string;
    mainImageUrl?: string | null;
    collection?: { name: string; nameAr?: string | null };
  }>;
}

export interface AdminPieceDetail {
  id: string;
  serialNumber: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  story?: string | null;
  storyAr?: string | null;
  material?: string | null;
  materialAr?: string | null;
  dimensions?: string | null;
  dimensionsAr?: string | null;
  weight?: number | null;
  price?: number | null;
  notes?: string | null;
  isActive?: boolean;
  mainImageUrl?: string | null;
  imageUrls?: string[];
  collectionId: string;
  collection: { id: string; name: string; nameAr?: string | null; slug: string };
  currentOwner: string | null;
  currentOwnerId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  specifications?: Array<{
    key: string;
    keyAr?: string | null;
    value: string;
    valueAr?: string | null;
  }>;
}

export interface AdminOrderDetail {
  id: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  totalAmount: string | number;
  currency: string;
  placedAt: string;
  completedAt?: string | null;
  client: { id: string; displayName: string; email: string };
  items: Array<{
    id: string;
    piece: { id: string; serialNumber: string; name?: string; nameAr?: string | null };
    priceAtPurchase: string | number;
  }>;
  shippingAddress?: string | null;
  notes?: string | null;
}
