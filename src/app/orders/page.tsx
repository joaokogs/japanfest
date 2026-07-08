"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";
import Dialog from "@/components/dialog";
import { toast } from "sonner";
import { mockApi, MOCK_CUSTOMIZATIONS, getProductImageUrl } from "@/lib/mockData";

const sortOrders = (arr: Order[]) =>
    [...arr].sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade ? -1 : 1));

const groupItems = (items: any[]) => {
    const grouped: any[] = [];
    for (const item of items) {
        const hasCust = item.customizations && item.customizations.length > 0;
        if (!hasCust) {
            const existing = grouped.find((g) => g.name === item.name && (!g.customizations || g.customizations.length === 0));
            if (existing) {
                existing.quantity += item.quantity;
                continue;
            }
        }
        grouped.push({ ...item });
    }
    return grouped;
};

const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();
const toOrderId = (value: unknown) => Number(value);

const getLocalCustomizations = (orderId: number) => {
	try {
		const stored = JSON.parse(localStorage.getItem("orderCustomizations") ?? "{}");
		return (stored[String(orderId)] ?? []) as {
			productId: number; quantity: number; unitPrice: number; customizationDescs: string[]; customizationIds: number[];
		}[];
	} catch { return []; }
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingId, setPendingId] = useState<number | null>(null);

    const fetchOrdersInQueue = useCallback(async (): Promise<Order[]> => {
        const allOrders = await mockApi.getOrders("Fila");

        const mapped: Order[] = allOrders.map((o: any) => {
            const items = o.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                note: item.note,
                image: getProductImageUrl(item.product_id || 0),
                customizations: item.customizations || [],
            }));

            const localItems = getLocalCustomizations(Number(o.id));
            if (localItems.length > 0) {
                items.forEach((item: any, idx: number) => {
                    if (idx < localItems.length && localItems[idx].customizationDescs.length > 0) {
                        item.customizations = localItems[idx].customizationDescs.map((desc: string, i: number) => ({
                            id: localItems[idx].customizationIds[i] ?? 0,
                            description: desc,
                        }));
                    }
                });
            }

            return { id: o.id, prioridade: !!o.priority, status: o.status, items: groupItems(items) };
        });

        return sortOrders(mapped);
    }, []);

    const refreshOrders = useCallback(async () => {
        try {
            const mapped = await fetchOrdersInQueue();
            setOrders(mapped);
        } catch (err) {
            console.error("Failed to refresh orders list", err);
        }
    }, [fetchOrdersInQueue]);

    const handleMarkAsReady = async (id: number) => {
        try {
            await mockApi.updateOrderStatus(id, "Pronto");
            setOrders((prev) => sortOrders(prev.filter((o) => o.id !== id)));
            toast.success(`Pedido #${id} est\u00E1 pronto!`);
        } catch (err) {
            console.error("Failed to update order status", err);
        }
    };

    useEffect(() => {
        let mounted = true;

        const handleOrderCreated = (e: Event) => {
            if (!mounted) return;
            void refreshOrders();
        };

        const handleOrderUpdated = (e: Event) => {
            if (!mounted) return;
            const detail = (e as CustomEvent).detail;
            if (detail && (detail.status === "Pronto" || detail.status === "Entregue" || detail.status === "Cancelado")) {
                if (Number.isFinite(detail.id)) {
                    setOrders((prev) => sortOrders(prev.filter((o) => o.id !== detail.id)));
                } else {
                    void refreshOrders();
                }
                return;
            }
            void refreshOrders();
        };

        window.addEventListener("japanfest:order-created", handleOrderCreated);
        window.addEventListener("japanfest:order-updated", handleOrderUpdated);

        const load = async () => {
            try {
                const mapped = await fetchOrdersInQueue();
                if (!mounted) return;
                setOrders(mapped);
            } catch (err) {
                console.error("Failed to load orders", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();

        return () => {
            mounted = false;
            window.removeEventListener("japanfest:order-created", handleOrderCreated);
            window.removeEventListener("japanfest:order-updated", handleOrderUpdated);
        };
    }, [refreshOrders]);

    if (loading) return <div style={{ padding: 24, color: "#888" }}>Carregando pedidos...</div>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", columnGap: 24, rowGap: 12, width: "100%" }}>
                {orders.length === 0 ? (
                    <div style={{ color: "#666" }}>Nenhum pedido na fila.</div>
                ) : (
                    orders.map((order) => (
                            <OrdersCard
                                key={order.id}
                                order={order}
                                onFinish={() => setPendingId(order.id)}
                            />
                        ))
                )}
            </div>
                <Dialog
                    open={pendingId !== null}
                    onClose={() => setPendingId(null)}
                    onConfirm={() => { if (pendingId !== null) handleMarkAsReady(pendingId).finally(() => setPendingId(null)); }}
                    title="Confirmar mudança para Pronto"
                    description={pendingId ? `Deseja marcar o pedido #${pendingId} como Pronto?` : undefined}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28}>
                            <path fill="#fff" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                        </svg>
                    }
                    iconBg="#4caf50"
                    confirmLabel="Marcar como Pronto"
                    confirmColor="#4caf50"
                    cancelLabel="Cancelar"
                />
        </div>
    );
}
