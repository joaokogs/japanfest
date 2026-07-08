import type { MergedOrder, Order, OrderItem, OrderProduct, Product, StockEntry, StockMovement } from "./types";
import { MOCK_PRODUCTS, MOCK_CUSTOMIZATIONS, MOCK_STOCKS, mockApi, getProductImageUrl } from "./mockData";

export async function fetchProducts(): Promise<Product[]> {
  const data = await mockApi.getProducts();
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    priority: p.priority,
    customizable: p.customizable,
  }));
}

export async function fetchProductCustomizations(productId: number): Promise<{ id: number; description: string }[]> {
  return MOCK_CUSTOMIZATIONS[productId] ?? [];
}

export async function fetchStocks(): Promise<StockEntry[]> {
  return mockApi.getStocks();
}

export async function fetchOrders(
  sort?: string,
  status?: string,
  order?: string,
): Promise<Order[]> {
  const data = await mockApi.getOrders(status);
  const sorted = [...data];
  if (sort === "id" && order === "asc") {
    sorted.sort((a, b) => a.id - b.id);
  } else if (sort === "updated_at" && order === "desc") {
    sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }
  return sorted.map(mapMockOrderToOrder);
}

export async function fetchOrdersWithItems(): Promise<Order[]> {
  const data = await mockApi.getOrders();
  return data
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map(mapMockOrderToOrder);
}

const LOSS_PAYMENTS = ["Staff", "Perda"];

function getLossField(raw: Record<string, unknown>): string {
  const val = raw.payment_method ?? raw.paymentMethod ?? raw.loss_type ?? raw.lossType ?? "";
  return String(val);
}

export function isLossOrder(raw: Record<string, unknown>): boolean {
  return LOSS_PAYMENTS.includes(getLossField(raw));
}

export function filterLossOrders<T>(orders: T[]): T[] {
  return orders.filter((o) => !isLossOrder(o as unknown as Record<string, unknown>));
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  await mockApi.updateOrderStatus(id, status);
}

export async function updateStock(productId: number, quantity: number): Promise<void> {
  const stocks = MOCK_STOCKS;
  const idx = stocks.findIndex((s) => s.product_id === productId);
  if (idx >= 0) {
    stocks[idx].quantity = quantity;
  }
}

export async function createStockMovement(movement: StockMovement): Promise<void> {
  await updateStock(movement.product_id, movement.quantity);
}

function mapMockOrderToOrder(mock: import("./mockData").MockOrder): Order {
  const orderProducts: OrderProduct[] = mock.items.map((item) => ({
    product_id: 0,
    name: item.name,
    quantity: item.quantity,
    note: item.note,
    customizations: item.customizations?.map((c) => c.description) ?? null,
  }));
  return {
    id: mock.id,
    priority: mock.priority,
    status: mock.status,
    created_at: mock.created_at,
    updated_at: mock.updated_at,
    products: orderProducts,
    items: orderProducts,
    payment_method: mock.payment_method,
  };
}

export async function buildMergedOrders(rawOrders: Order[]): Promise<MergedOrder[]> {
  const products = await fetchProducts().catch(() => [] as Product[]);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return rawOrders.map((o) => ({
    id: o.id,
    priority: o.priority,
    status: o.status,
    date: o.updated_at ?? o.created_at ?? "",
    items: mapOrderItems(o, productMap),
    payment_method: o.payment_method,
  }));
}

function mapOrderItems(
  order: Order,
  productMap: Map<number, Product>,
): OrderItem[] {
  const source = order.products ?? order.items ?? [];
  return source.map((item) => {
    const prod = productMap.get(item.product_id);
    const customizations = parseCustomizations(item.customizations);

    return {
      name: item.name || prod?.name || `Produto #${item.product_id}`,
      quantity: item.quantity,
      note: item.note,
      image: prod ? getProductImageUrl(prod.id) : undefined,
      customizations,
    };
  });
}

function parseCustomizations(
  raw: string[] | null | undefined,
): { id: number; description: string }[] {
  if (!raw || raw.length === 0) return [];
  const result: { id: number; description: string }[] = [];
  let idCounter = 0;
  for (const entry of raw) {
    const parts = entry.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      result.push({ id: ++idCounter, description: part });
    }
  }
  return result;
}
