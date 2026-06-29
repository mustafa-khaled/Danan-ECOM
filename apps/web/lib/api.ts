const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:4000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "/backend");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? String(payload.message)
        : "Request failed";
    const code =
      payload && typeof payload === "object" && "code" in payload && payload.code
        ? String(payload.code)
        : undefined;
    throw new ApiError(message, response.status, code);
  }

  return payload as T;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  cookieHeader?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: cookieHeader ? undefined : "include",
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export interface ClientProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string | null;
  locale: string;
  visibilityGroups: string[];
  createdAt: string;
}

export interface ValidateKeyResponse {
  clientId: string;
  displayName: string;
  visibilityGroups: string[];
  token?: string;
}

export async function validateHouseKey(houseKey: string): Promise<ValidateKeyResponse> {
  return apiFetch<ValidateKeyResponse>("/auth/validate-key", {
    method: "POST",
    body: JSON.stringify({ houseKey }),
  });
}

export async function fetchMe(cookieHeader?: string): Promise<ClientProfile> {
  return apiFetch<ClientProfile>("/auth/me", {}, cookieHeader);
}

export async function fetchCollections(cookieHeader?: string) {
  return apiFetch<
    Array<{
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      coverImageUrl?: string | null;
      pieceCount: number;
    }>
  >("/client/collections", {}, cookieHeader);
}

export async function fetchCollection(slug: string, cookieHeader?: string) {
  return apiFetch<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    coverImageUrl?: string | null;
    designs: Array<{
      id: string;
      name: string;
      slug: string;
      basePrice: string;
      currency: string;
      imageUrls: string[];
    }>;
  }>(`/client/collections/${slug}`, {}, cookieHeader);
}

export async function fetchDesign(slug: string, cookieHeader?: string) {
  return apiFetch<{
    id: string;
    name: string;
    slug: string;
    story?: string | null;
    material: string;
    weight: number;
    dimensions: string;
    imageUrls: string[];
    basePrice: string;
    currency: string;
    collection: { id: string; name: string; slug: string };
    specifications: Array<{ key: string; value: string; sortOrder: number }>;
    availablePieces: Array<{ id: string; serialNumber: string; status: string }>;
  }>(`/client/designs/${slug}`, {}, cookieHeader);
}

export async function fetchWardrobe(cookieHeader?: string) {
  return apiFetch<
    Array<{
      id: string;
      serialNumber: string;
      status: string;
      design: {
        name: string;
        images: string[];
        collection: string;
      };
      acquiredAt: string;
    }>
  >("/client/wardrobe", {}, cookieHeader);
}

export async function fetchWardrobePiece(pieceId: string, cookieHeader?: string) {
  return apiFetch<Record<string, unknown>>(`/client/wardrobe/${pieceId}`, {}, cookieHeader);
}

export async function fetchSaved(cookieHeader?: string) {
  return apiFetch<
    Array<{
      savedAt: string;
      piece: {
        id: string;
        serialNumber: string;
        status: string;
        design: { name: string; slug?: string; imageUrls?: string[]; collection?: { name: string } };
      };
    }>
  >("/client/saved", {}, cookieHeader);
}

export async function savePiece(pieceId: string) {
  return apiFetch(`/client/saved/${pieceId}`, { method: "POST" });
}

export async function unsavePiece(pieceId: string) {
  return apiFetch(`/client/saved/${pieceId}`, { method: "DELETE" });
}

export async function fetchCart(cookieHeader?: string) {
  return apiFetch<
    Array<{
      id: string;
      addedAt: string;
      expiresAt: string;
      piece: {
        id: string;
        serialNumber: string;
        design: {
          name: string;
          basePrice: string;
          currency: string;
          imageUrls: string[];
          collection: { name: string };
        };
      } | null;
    }>
  >("/client/cart", {}, cookieHeader);
}

export async function addToCart(pieceId: string) {
  return apiFetch("/client/cart", {
    method: "POST",
    body: JSON.stringify({ pieceId }),
  });
}

export async function removeFromCart(pieceId: string) {
  return apiFetch(`/client/cart/${pieceId}`, { method: "DELETE" });
}

export async function checkout(body: Record<string, unknown>) {
  return apiFetch("/client/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchOrders(cookieHeader?: string) {
  return apiFetch<{
    items: Array<{
      id: string;
      status: string;
      totalAmount: string;
      currency: string;
      placedAt: string;
      items: Array<{ piece: { serialNumber: string }; design: { name: string } }>;
    }>;
    total: number;
  }>("/client/orders", {}, cookieHeader);
}

export async function fetchOrder(orderId: string, cookieHeader?: string) {
  return apiFetch<{
    id: string;
    status: string;
    totalAmount: string;
    currency: string;
    placedAt: string;
    paymentProvider: string;
    paymentReference: string;
    shippingAddress: Record<string, string>;
    items: Array<{
      priceAtPurchase: string;
      piece: { id: string; serialNumber: string };
      design: { name: string; imageUrls: string[] };
    }>;
  }>(`/client/orders/${orderId}`, {}, cookieHeader);
}

export async function fetchTransfers(cookieHeader?: string) {
  return apiFetch<
    Array<{
      id: string;
      status: string;
      transferType: string;
      initiatedAt: string;
      piece: { id: string; serialNumber: string; name: string };
      otherPartyDisplayName: string;
    }>
  >("/client/transfers", {}, cookieHeader);
}

export async function fetchTransfer(transferId: string, cookieHeader?: string) {
  return apiFetch<{
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
  }>(`/client/transfers/${transferId}`, {}, cookieHeader);
}

export async function confirmTransferSender(transferId: string) {
  return apiFetch(`/client/transfers/${transferId}/confirm-sender`, { method: "POST" });
}

export async function confirmTransferRecipient(transferId: string) {
  return apiFetch(`/client/transfers/${transferId}/confirm-recipient`, { method: "POST" });
}

export async function cancelTransfer(transferId: string) {
  return apiFetch(`/client/transfers/${transferId}/cancel`, { method: "POST" });
}

export async function fetchCertificate(pieceId: string, cookieHeader?: string) {
  return apiFetch<{
    certificateNumber: string;
    issuedAt: string;
    pdfUrl?: string | null;
    qrCodeData?: string | null;
  }>(`/client/wardrobe/${pieceId}/certificate`, {}, cookieHeader);
}

export async function verifySerial(serial: string, token: string) {
  return apiFetch<Record<string, unknown>>(
    `/verify?serial=${encodeURIComponent(serial)}&token=${encodeURIComponent(token)}`,
  );
}
