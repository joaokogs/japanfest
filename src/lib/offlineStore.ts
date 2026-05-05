"use client";

import bebidaImage from "@/assets/images/beibda.png";
import comidaImage from "@/assets/images/comida.jpg";

export type PaymentMethod = "Cartão de Débito" | "Cartão de Crédito" | "Pix" | "Dinheiro";
export type OrderStatus = "Fila" | "Pronto" | "Entregue";

export type Product = {
	id: number;
	name: string;
	price: number;
	category: string;
	priority: boolean;
	image: string;
};

export type OfflineOrderItem = {
	id: number;
	name: string;
	quantity: number;
	unit_price: number;
	image: string;
	category: string;
};

export type OfflineOrder = {
	id: number;
	priority: boolean;
	status: OrderStatus;
	payment_method: PaymentMethod;
	total_price: number;
	created_at: string;
	updated_at: string;
	items: OfflineOrderItem[];
};

type CreateOrderItemInput = {
	id: number;
	quantity: number;
	unit_price?: number;
};

type CreateOfflineOrderInput = {
	list_items: CreateOrderItemInput[];
	payment_method: PaymentMethod;
	total_price: number;
};

const OFFLINE_ORDERS_STORAGE_KEY = "festivaljapao.offline.orders.v1";
const OFFLINE_ORDERS_COUNTER_KEY = "festivaljapao.offline.orders.counter.v1";
const OFFLINE_ORDERS_EVENT = "festivaljapao:offline-orders-changed";

export const OFFLINE_PRODUCTS: Product[] = [
	{ id: 1, name: "Lámen Tonkotsu", price: 39.9, category: "comida", priority: false, image: comidaImage.src },
	{ id: 2, name: "Yakisoba de Frango", price: 34.9, category: "comida", priority: false, image: comidaImage.src },
	{ id: 3, name: "Karê Japonês", price: 36.5, category: "comida", priority: true, image: comidaImage.src },
	{ id: 4, name: "Gyoza (6 un.)", price: 24.0, category: "comida", priority: false, image: comidaImage.src },
	{ id: 5, name: "Coca-Cola 350ml", price: 8.0, category: "bebida", priority: false, image: bebidaImage.src },
	{ id: 6, name: "Água sem Gás 500ml", price: 6.0, category: "bebida", priority: false, image: bebidaImage.src },
	{ id: 7, name: "Chá Gelado", price: 9.5, category: "bebida", priority: false, image: bebidaImage.src },
	{ id: 8, name: "Refrigerante Zero", price: 8.5, category: "bebida", priority: false, image: bebidaImage.src },
];

export const OFFLINE_FALLBACK_IMAGE = comidaImage.src;

const isBrowser = () => typeof window !== "undefined";

const emitOrdersChanged = () => {
	if (!isBrowser()) return;
	window.dispatchEvent(new Event(OFFLINE_ORDERS_EVENT));
};

const readStoredOrders = (): OfflineOrder[] => {
	if (!isBrowser()) return [];
	const raw = window.localStorage.getItem(OFFLINE_ORDERS_STORAGE_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as OfflineOrder[]) : [];
	} catch {
		return [];
	}
};

const writeStoredOrders = (orders: OfflineOrder[]) => {
	if (!isBrowser()) return;
	window.localStorage.setItem(OFFLINE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
	emitOrdersChanged();
};

const getNextOrderId = (orders: OfflineOrder[]) => {
	if (!isBrowser()) return 1;
	const rawCounter = Number(window.localStorage.getItem(OFFLINE_ORDERS_COUNTER_KEY));
	if (Number.isFinite(rawCounter) && rawCounter > 0) {
		const next = rawCounter + 1;
		window.localStorage.setItem(OFFLINE_ORDERS_COUNTER_KEY, String(next));
		return next;
	}
	const maxExistingId = orders.reduce((max, order) => Math.max(max, order.id), 999);
	const next = maxExistingId + 1;
	window.localStorage.setItem(OFFLINE_ORDERS_COUNTER_KEY, String(next));
	return next;
};

export const getOfflineProducts = async (): Promise<Product[]> => OFFLINE_PRODUCTS;

export const getOfflineCategories = async (): Promise<string[]> =>
	Array.from(new Set(OFFLINE_PRODUCTS.map((product) => product.category)));

export const getOfflineOrders = async (): Promise<OfflineOrder[]> => readStoredOrders();

export const getOfflineOrdersByStatus = async (status: OrderStatus): Promise<OfflineOrder[]> =>
	readStoredOrders().filter((order) => order.status === status);

export const createOfflineOrder = async (payload: CreateOfflineOrderInput): Promise<OfflineOrder> => {
	const orders = readStoredOrders();
	const productMap = new Map(OFFLINE_PRODUCTS.map((product) => [product.id, product]));
	const now = new Date().toISOString();
	const items: OfflineOrderItem[] = payload.list_items
		.map((item) => {
			const product = productMap.get(item.id);
			if (!product || item.quantity <= 0) return null;
			return {
				id: product.id,
				name: product.name,
				quantity: item.quantity,
				unit_price: item.unit_price ?? product.price,
				image: product.image,
				category: product.category,
			} satisfies OfflineOrderItem;
		})
		.filter((item): item is OfflineOrderItem => item !== null);

	if (items.length === 0) {
		throw new Error("Pedido sem itens");
	}

	const computedTotal = Number(
		items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2),
	);
	const orderId = getNextOrderId(orders);
	const order: OfflineOrder = {
		id: orderId,
		priority: items.some((item) => productMap.get(item.id)?.priority),
		status: "Fila",
		payment_method: payload.payment_method,
		total_price: Number.isFinite(payload.total_price) && payload.total_price > 0 ? payload.total_price : computedTotal,
		created_at: now,
		updated_at: now,
		items,
	};

	writeStoredOrders([...orders, order]);
	return order;
};

export const updateOfflineOrderStatus = async (orderId: number, status: OrderStatus): Promise<OfflineOrder | null> => {
	const orders = readStoredOrders();
	const index = orders.findIndex((order) => order.id === orderId);
	if (index < 0) return null;
	const updatedOrder: OfflineOrder = {
		...orders[index],
		status,
		updated_at: new Date().toISOString(),
	};
	orders[index] = updatedOrder;
	writeStoredOrders(orders);
	return updatedOrder;
};

export const subscribeToOfflineOrders = (callback: () => void): (() => void) => {
	if (!isBrowser()) return () => {};

	const handleLocalChange = () => callback();
	const handleStorage = (event: StorageEvent) => {
		if (event.key === OFFLINE_ORDERS_STORAGE_KEY) callback();
	};

	window.addEventListener(OFFLINE_ORDERS_EVENT, handleLocalChange);
	window.addEventListener("storage", handleStorage);

	return () => {
		window.removeEventListener(OFFLINE_ORDERS_EVENT, handleLocalChange);
		window.removeEventListener("storage", handleStorage);
	};
};
