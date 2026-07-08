"use client";

export type MockProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  customizable: boolean;
  priority: boolean;
};

export type MockCustomization = {
  id: number;
  description: string;
};

export type MockOrderItem = {
  name: string;
  quantity: number;
  note?: string;
  image?: string;
  customizations?: { id: number; description: string }[];
};

export type MockOrder = {
  id: number;
  priority: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  items: MockOrderItem[];
  payment_method?: string;
};

export type MockStockEntry = {
  product_id: number;
  quantity: number;
};

export type MockStockMovement = {
  product_id: number;
  order_id?: number;
  quantity: number;
  type: string;
};

export const MOCK_PRODUCTS: MockProduct[] = [
  { id: 2, name: "Gyozá 5Un", price: 22.0, category: "Comidas", customizable: false, priority: false },
  { id: 3, name: "Kitakata lámen", price: 32.0, category: "Comidas", customizable: true, priority: true },
  { id: 4, name: "Aizu Sauce Kushikatsu", price: 15.0, category: "Comidas", customizable: true, priority: false },
  { id: 5, name: "Ecusson Pie", price: 12.0, category: "Sobremesas", customizable: false, priority: false },
  { id: 6, name: "Mugui Chá", price: 8.0, category: "Bebidas", customizable: false, priority: false },
  { id: 7, name: "Pct. Lamén Importado", price: 15.0, category: "Comidas", customizable: false, priority: false },
  { id: 9, name: "Coca-Cola", price: 10.0, category: "Bebidas", customizable: true, priority: false },
  { id: 10, name: "Coca-Cola Zero", price: 10.0, category: "Bebidas", customizable: true, priority: false },
  { id: 11, name: "Fanta Laranja", price: 10.0, category: "Bebidas", customizable: true, priority: false },
  { id: 12, name: "Fanta Guaraná", price: 10.0, category: "Bebidas", customizable: true, priority: false },
  { id: 13, name: "Suco Del Valle Uva", price: 9.0, category: "Bebidas", customizable: true, priority: false },
  { id: 14, name: "Suco Del Valle Maracujá", price: 9.0, category: "Bebidas", customizable: true, priority: false },
  { id: 15, name: "Água Sem Gás", price: 8.0, category: "Bebidas", customizable: true, priority: false },
  { id: 16, name: "Água com Gás", price: 8.0, category: "Bebidas", customizable: true, priority: false },
  { id: 17, name: "Schweppes Citrus", price: 10.0, category: "Bebidas", customizable: true, priority: false },
  { id: 21, name: "Sake Honjozo Kanzukuri", price: 70.0, category: "Bebidas Alcoólicas", customizable: false, priority: false },
  { id: 22, name: "Sake Junmai Karakuchi", price: 85.0, category: "Bebidas Alcoólicas", customizable: false, priority: false },
  { id: 23, name: "Dose Sake Honjozo Kanzukuri", price: 15.0, category: "Bebidas Alcoólicas", customizable: false, priority: false },
];

export const MOCK_CATEGORIES: string[] = [
  "Comidas",
  "Sobremesas",
  "Bebidas",
  "Bebidas Alcoólicas",
];

export const MOCK_CUSTOMIZATIONS: Record<number, MockCustomization[]> = {
  3: [
    { id: 1, description: "Sem caldo" },
    { id: 2, description: "Sem macarrão" },
    { id: 3, description: "Sem naruto" },
    { id: 4, description: "Sem chasu" },
    { id: 5, description: "Sem nori" },
    { id: 6, description: "Sem cebolinha" },
  ],
  4: [{ id: 7, description: "Sem molho" }],
  9: [{ id: 8, description: "Sem gelo" }],
  10: [{ id: 9, description: "Sem gelo" }],
  11: [{ id: 10, description: "Sem gelo" }],
  12: [{ id: 11, description: "Sem gelo" }],
  13: [{ id: 12, description: "Sem gelo" }],
  14: [{ id: 13, description: "Sem gelo" }],
  15: [{ id: 14, description: "Sem gelo" }],
  16: [{ id: 15, description: "Sem gelo" }],
  17: [{ id: 16, description: "Sem gelo" }],
};

export function getProductImageUrl(productId: number): string {
  return `/images/${productId}.jpg`;
}

export const MOCK_STOCKS: MockStockEntry[] = MOCK_PRODUCTS.map((p) => ({
  product_id: p.id,
  quantity: 50,
}));

const STORAGE_KEY_ORDERS = "japanfest_mock_orders";
const STORAGE_KEY_COUNTER = "japanfest_mock_order_counter";

function getStoredOrders(): MockOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredOrders(orders: MockOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent("japanfest:orders-changed"));
}

function getNextOrderId(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(STORAGE_KEY_COUNTER);
  const next = raw ? Number(raw) + 1 : 1;
  localStorage.setItem(STORAGE_KEY_COUNTER, String(next));
  return next;
}

export const mockApi = {
  getProducts: async (): Promise<MockProduct[]> => {
    return MOCK_PRODUCTS;
  },

  getCategories: async (): Promise<string[]> => {
    return MOCK_CATEGORIES;
  },

  getCustomizations: async (productId: number): Promise<MockCustomization[]> => {
    return MOCK_CUSTOMIZATIONS[productId] ?? [];
  },

  getStocks: async (): Promise<MockStockEntry[]> => {
    return MOCK_STOCKS;
  },

  getOrders: async (status?: string): Promise<MockOrder[]> => {
    let orders = getStoredOrders();
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      orders = orders.filter((o) => statuses.includes(o.status));
    }
    return orders.sort((a, b) => a.id - b.id);
  },

  createOrder: async (items: { product_id: number; quantity: number; unit_price?: number }[], payment_method: string, total_price: number): Promise<MockOrder> => {
    const orders = getStoredOrders();
    const productMap = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));
    const orderId = getNextOrderId();
    const now = new Date().toISOString();
    const orderItems: MockOrderItem[] = items
      .map((item) => {
        const product = productMap.get(item.product_id);
        if (!product || item.quantity <= 0) return null;
        return {
          name: product.name,
          quantity: item.quantity,
          image: getProductImageUrl(product.id),
          customizations: [],
        } as MockOrderItem;
      })
      .filter((item): item is MockOrderItem => item !== null);

    const order: MockOrder = {
      id: orderId,
      priority: items.some((item) => productMap.get(item.product_id)?.priority),
      status: "Fila",
      payment_method,
      created_at: now,
      updated_at: now,
      items: orderItems,
    };

    setStoredOrders([...orders, order]);
    window.dispatchEvent(new CustomEvent("japanfest:order-created", { detail: { id: orderId, status: "Fila" } }));
    return order;
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<void> => {
    const orders = getStoredOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index >= 0) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setStoredOrders(orders);
      window.dispatchEvent(new CustomEvent("japanfest:order-updated", { detail: { id: orderId, status } }));
    }
  },
};
