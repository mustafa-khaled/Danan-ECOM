export type OperationStatus =
  | "PENDING"
  | "COMPLETED"
  | "UNDER_REVIEW"
  | "REJECTED";

export type OperationTransferType = "INCOMING" | "OUTGOING" | "INTERNAL";

export type OperationType =
  | "ACCESS_REQUEST"
  | "PIECE_TRANSFER"
  | "MEMBERSHIP_UPGRADE"
  | "KEY_ISSUANCE";

export interface OperationItem {
  id: string;
  kind: "transfer" | "staff";
  requestNumber: string;
  title: string;
  type: OperationType;
  transferType: OperationTransferType;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  date: string;
  status: OperationStatus;
  pieceName?: string;
  details?: string;
}
