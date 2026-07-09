export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  adminMe: () => [...authKeys.all, "admin-me"] as const,
};

export const collectionsKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...collectionsKeys.lists(), filters] as const,
  detail: (slug: string) => [...collectionsKeys.all, slug] as const,
};

export const piecesKeys = {
  all: ["pieces"] as const,
  detail: (slug: string) => [...piecesKeys.all, slug] as const,
};

export const wardrobeKeys = {
  all: ["wardrobe"] as const,
  lists: () => [...wardrobeKeys.all, "list"] as const,
  list: () => [...wardrobeKeys.lists()] as const,
  detail: (id: string) => [...wardrobeKeys.all, id] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
};

export const ordersKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersKeys.all, "list"] as const,
  list: (page?: number) => [...ordersKeys.lists(), page] as const,
  detail: (id: string) => [...ordersKeys.all, id] as const,
};

export const transfersKeys = {
  all: ["transfers"] as const,
  list: () => [...transfersKeys.all, "list"] as const,
  detail: (id: string) => [...transfersKeys.all, id] as const,
};

export const savedKeys = {
  all: ["saved"] as const,
  lists: () => [...savedKeys.all, "list"] as const,
  list: () => [...savedKeys.lists()] as const,
};

export const certificatesKeys = {
  all: ["certificates"] as const,
  detail: (pieceId: string) => [...certificatesKeys.all, pieceId] as const,
};

export const verifyKeys = {
  all: ["verify"] as const,
  lists: () => [...verifyKeys.all, "list"] as const,
  list: () => [...verifyKeys.lists()] as const,
};

export const adminKeys = {
  all: ["admin"] as const,
  clients: (page = 1, limit = 20) =>
    [...adminKeys.all, "clients", page, limit] as const,
  pieces: (page = 1, limit = 20) =>
    [...adminKeys.all, "pieces", page, limit] as const,
  orders: (page = 1, limit = 20) =>
    [...adminKeys.all, "orders", page, limit] as const,
  transfers: (page = 1, limit = 20, status?: string) =>
    [...adminKeys.all, "transfers", page, limit, status] as const,
};
