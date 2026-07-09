export interface ClientSession {
  id: string;
  displayName: string;
  visibilityGroups: string[];
}

export interface AdminSession {
  adminId: string;
  email: string;
  role: "SUPER_ADMIN" | "STAFF" | "VIEWER";
  displayName: string;
}

export interface ValidateKeyResponse {
  clientId: string;
  displayName: string;
  visibilityGroups: string[];
}
