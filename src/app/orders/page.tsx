"use client";

import { useCallback, useEffect, useState } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";
import Dialog from "@/components/dialog";
import { toast } from "sonner";

interface OrderItem {
    name: string;
    quantity: number;
    note?: string;
}

const sortOrders = (arr: Order[]) =>
    [...arr].sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade ? -1 : 1));

const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();
const toOrderId = (value: unknown) => Number(value);
const REFRESH_INTERVAL_MS = 3000;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingId, setPendingId] = useState<number | null>(null);

    const fetchOrdersInQueue = useCallback(async (): Promise<Order[]> => {
        const [productsData, ordersData] = await Promise.all([
            fetch("/api/products").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/api/orders/items").then((r) => r.ok ? r.json() : []).catch(() => []),
        ]);

        const nameToId = new Map<string, number>();
        (productsData || []).forEach((p: any) => {
            if (p && p.name && p.id) nameToId.set(String(p.name).toLowerCase(), p.id);
        });

        const mapped: Order[] = (ordersData || [])
            .filter((o: any) => o.status === "Fila")
            .map((o: any) => ({
                id: o.id,
                prioridade: !!o.priority,
                status: o.status,
                items: (o.products || []).map((name: string) => {
                    const id = nameToId.get(String(name).toLowerCase());
                    return {
                        name,
                        quantity: 1,
                        image: id ? `/api/product/image/${id}` : undefined,
                    } as any;
                }),
            }));

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
            const res = await fetch(`/api/order/${id}/Pronto`, { method: "PATCH" });
            if (!res.ok) {
                let body = "";
                try { body = await res.text(); } catch { body = "<unreadable>"; }
                console.error(`Failed to update status. HTTP ${res.status}`, body);
                return;
            }
            setOrders((prev) => sortOrders(prev.filter((o) => o.id !== id)));
            toast.success(`Pedido #${id} esta pronto!`);
        } catch (err) {
            console.error("Failed to update order status", err);
        }
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const mapped = await fetchOrdersInQueue();
                if (!mounted) return;
                setOrders(mapped);
            } catch (err) {
                console.error("Failed to load products or orders items", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => { mounted = false; };
    }, [fetchOrdersInQueue]);

    useEffect(() => {
        const source = new EventSource("/api/events/orders");

        source.onmessage = (event) => {
            let payload: { id?: number | string; status?: string } | null = null;
            try {
                payload = JSON.parse(event.data);
            } catch {
                return;
            }

            const status = normalizeStatus(payload?.status);
            const orderId = toOrderId(payload?.id);
            if (!status) return;

            if (status === "fila" || status === "novo" || status === "recebido" || status === "em preparo" || status === "preparando") {
                void refreshOrders();
                return;
            }

            if (status === "pronto" || status === "entregue" || status === "cancelado") {
                if (Number.isFinite(orderId)) {
                    setOrders((prev) => sortOrders(prev.filter((o) => o.id !== orderId)));
                } else {
                    void refreshOrders();
                }
                return;
            }

            // Qualquer status não mapeado também força sincronização.
            void refreshOrders();
        };

        source.onerror = (error) => {
            console.error("SSE /events/orders error", error);
        };

        return () => {
            source.close();
        };
    }, [refreshOrders]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void refreshOrders();
        }, REFRESH_INTERVAL_MS);
        return () => {
            window.clearInterval(intervalId);
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
