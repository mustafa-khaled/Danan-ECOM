export interface SavedEntry {
  savedAt: string;
  piece: {
    id: string;
    serialNumber: string;
    status: string;
    name: string;
    slug?: string;
    mainImageUrl?: string | null;
    mainImageLqip?: string | null;
    imageUrls?: string[];
    collection?: { name: string };
  };
}
