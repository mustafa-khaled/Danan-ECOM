export interface SavedEntry {
  savedAt: string;
  piece: {
    id: string;
    serialNumber: string;
    status: string;
    name: string;
    slug?: string;
    imageUrls?: string[];
    collection?: { name: string };
  };
}
