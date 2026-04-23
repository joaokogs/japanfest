"use client";

import { useEffect, useState } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";
import Dialog from "@/components/dialog";
import { toast } from "sonner";

const sortOrders = (arr: Order[]) =>
    [...arr].sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade ? -1 : 1));

export default function DeliveredPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingId, setPendingId] = useState<number | null>(null);

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
                    .filter((o: any) => o.status === "Pronto")
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
            .catch((err) => console.error("Failed to load orders", err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const handleDeliver = async (id: number) => {
        try {
            const res = await fetch(`/api/order/${id}/Entregue`, { method: "PATCH" });
            if (!res.ok) {
                let body = "";
                try { body = await res.text(); } catch { body = "<unreadable>"; }
                console.error(`Failed to deliver order. HTTP ${res.status}`, body);
                return;
            }
            setOrders((prev) => sortOrders(prev.filter((o) => o.id !== id)));
            toast.success(`Pedido #${id} foi entregue!`);
        } catch (err) {
            console.error("Failed to deliver order", err);
        }
    };

    if (loading) return <div style={{ padding: 24, color: "#888" }}>Carregando pedidos...</div>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", columnGap: 24, rowGap: 12, width: "100%" }}>
                {orders.length === 0 ? (
                    <div style={{ color: "#666" }}>Nenhum pedido pronto para entrega.</div>
                ) : (
                    orders.map((order) => (
                        <OrdersCard
                            key={order.id}
                            order={order}
                            buttonLabel="Entregar"
                            onFinish={() => setPendingId(order.id)}
                        />
                    ))
                )}
            </div>

            <Dialog
                open={pendingId !== null}
                onClose={() => setPendingId(null)}
                onConfirm={() => { if (pendingId !== null) handleDeliver(pendingId).finally(() => setPendingId(null)); }}
                title="Confirmar entrega"
                description={`Deseja marcar o pedido #${pendingId} como entregue?`}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28}>
                        <path fill="#fff" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4zM6 18.5A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5z"/>
                    </svg>
                }
                iconBg="#4caf50"
                confirmLabel="Entregar"
                confirmColor="#4caf50"
                cancelLabel="Cancelar"
            />
        </div>
    );
}
