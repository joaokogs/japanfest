import type { MergedOrder, Order, OrderItem, Product, StockEntry, StockMovement } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "<unreadable>";
    }
    throw new Error(body || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  return request<Product[]>("/api/products");
}

export async function fetchStocks(): Promise<StockEntry[]> {
  return request<StockEntry[]>("/api/stocks");
}

export async function fetchOrders(
  sort?: string,
  status?: string,
  order?: string,
): Promise<Order[]> {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  if (status) params.set("status", status);
  if (order) params.set("order", order);
  const qs = params.toString();
  return request<Order[]>(`/api/orders${qs ? `?${qs}` : ""}`);
}

export async function fetchOrdersWithItems(): Promise<Order[]> {
  return request<Order[]>("/api/orders?include=items_and_customizations&sort=updated_at&order=desc");
}

const LOSS_PAYMENTS = ["Staff", "Perda", "Doação"];

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
  const res = await fetch(`/api/orders/${id}/${status}`, { method: "PATCH" });
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "<unreadable>";
    }
    throw new Error(body || `Erro HTTP ${res.status}`);
  }
}

export async function updateStock(productId: number, quantity: number): Promise<void> {
  const res = await fetch(`/api/stocks/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "<unreadable>";
    }
    throw new Error(body || `Erro HTTP ${res.status}`);
  }
}

export async function createStockMovement(
  movement: StockMovement,
): Promise<void> {
  const res = await fetch("/api/stocks/movements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movement),
  });
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "<unreadable>";
    }
    const detail = `${res.status} ${res.statusText} — ${body}`;
    console.error("[createStockMovement] erro:", {
      status: res.status,
      statusText: res.statusText,
      body,
      movement,
    });
    throw new Error(detail);
  }
}

/** Map raw API orders into MergedOrder with resolved names & images */
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
      image: prod ? `/api/products/${prod.id}/image` : undefined,
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
    // Some entries are comma-separated like "teste,teste2,teste3"
    const parts = entry.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      result.push({ id: ++idCounter, description: part });
    }
  }
  return result;
}
