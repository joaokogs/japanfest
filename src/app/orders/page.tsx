"use client";

import { useEffect, useState } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";

interface OrderItem {
    name: string;
    quantity: number;
    note?: string;
}

const sortOrders = (arr: Order[]) =>
    [...arr].sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade ? -1 : 1));

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (err) {
            console.error("Failed to update order status", err);
        }
    };

    useEffect(() => {
        let mounted = true;
        Promise.all([
            fetch("/api/products").then((r) => r.ok ? r.json() : []).catch(() => []),
            fetch("/api/orders/items").then((r) => r.ok ? r.json() : []).catch(() => []),
        ])
            .then(([productsData, ordersData]: any[]) => {
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

                if (mounted) setOrders(sortOrders(mapped));
            })
            .catch((err) => console.error("Failed to load products or orders items", err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

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
                            onFinish={() => handleMarkAsReady(order.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}