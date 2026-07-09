export interface SavedEntry {
  savedAt: string;
  piece: {
    id: string;
    serialNumber: string;
    status: string;
    design: {
      name: string;
      slug?: string;
      imageUrls?: string[];
      collection?: { name: string };
    };
  };
}
