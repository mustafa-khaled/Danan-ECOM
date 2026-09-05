export type MembershipClass = "Class A" | "Class B" | "Class C";
export type MemberStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export interface MemberListItem {
  id: string;
  cellNumber: string;
  name: string;
  email: string;
  membershipClass: MembershipClass;
  status: MemberStatus;
  ownedPiecesCount: number;
  houseKeyActive: boolean;
  joinedDate: string;
  lastActive: string;
  avatarUrl?: string;
}
