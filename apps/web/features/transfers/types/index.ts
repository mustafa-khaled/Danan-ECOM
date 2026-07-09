export interface TransferSummary {
  id: string;
  status: string;
  transferType: string;
  initiatedAt: string;
  piece: { id: string; serialNumber: string; name: string };
  otherPartyDisplayName: string;
}

export interface TransferDetail {
  id: string;
  status: string;
  transferType: string;
  initiatedAt: string;
  senderConfirmedAt?: string | null;
  recipientConfirmedAt?: string | null;
  fromClientId: string;
  toClientId: string;
  piece: {
    id: string;
    serialNumber: string;
    design: { name: string; imageUrls: string[] };
  };
  fromClient: { displayName: string };
  toClient: { displayName: string };
}
