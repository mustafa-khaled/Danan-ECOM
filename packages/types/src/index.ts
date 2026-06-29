export interface ClientSession {
  clientId: string;
  displayName: string;
  visibilityGroups: string[];
}

export interface AdminSession {
  adminId: string;
  email: string;
  role: "SUPER_ADMIN" | "STAFF" | "VIEWER";
  displayName: string;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface ValidateKeyResponse {
  clientId: string;
  displayName: string;
  visibilityGroups: string[];
}

export interface ApiErrorBody {
  message: string;
  statusCode: number;
}
