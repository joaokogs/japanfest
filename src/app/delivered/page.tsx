"use client";

import { useEffect, useState } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";
import Dialog from "@/components/dialog";
import { toast } from "sonner";

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

const getLocalCustomizations = (orderId: number) => {
	try {
		const stored = JSON.parse(localStorage.getItem("orderCustomizations") ?? "{}");
		return (stored[String(orderId)] ?? []) as {
			productId: number; quantity: number; unitPrice: number; customizationDescs: string[]; customizationIds: number[];
		}[];
	} catch { return []; }
};

const mapOrderItems = (order: any, nameToId: Map<string, number>, customizationNameMap?: Record<number, Record<number, string>>) => {
    const source = Array.isArray(order?.items)
        ? order.items
        : Array.isArray(order?.products)
            ? order.products
            : [];

    return source
        .map((item: any, index: number) => {
            if (typeof item === "string") {
                const id = nameToId.get(String(item).toLowerCase());
                return {
                    name: item,
                    quantity: 1,
                    image: id ? `/api/products/${id}/image` : undefined,
                } as any;
            }

            if (!item || typeof item !== "object") return null;

            const rawName = item.name ?? item.product_name ?? item.title;
            const name = String(rawName ?? "").trim();
            const quantityValue = Number(item.quantity);
            const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
            const productIdValue = Number(item.product_id ?? item.id);
            const fromProductId = Number.isFinite(productIdValue) && productIdValue > 0 ? productIdValue : undefined;
            const fromName = name ? nameToId.get(name.toLowerCase()) : undefined;
            const productId = fromProductId ?? fromName;
            const note = typeof item.note === "string" ? item.note : typeof item.observation === "string" ? item.observation : undefined;
            const customizations = Array.isArray(item.customizations) && item.customizations.length > 0
                ? typeof item.customizations[0] === "number" || typeof item.customizations[0] === "string"
                    ? customizationNameMap && productId && customizationNameMap[productId]
                        ? item.customizations
                            .map((cid: any) => {
                                const desc = customizationNameMap[productId]?.[Number(cid)];
                                return desc ? { id: Number(cid), description: desc } : null;
                            })
                            .filter(Boolean)
                        : item.customizations.map((cid: any) => ({ id: Number(cid), description: `#${cid}` }))
                    : item.customizations.map((c: any) => ({ id: Number(c.id), description: String(c.description ?? "") }))
                : undefined;
            const safeName = name || (fromProductId ? `Item #${fromProductId}` : `Item ${index + 1}`);

            return {
                name: safeName,
                quantity,
                note,
                customizations,
                image: productId ? `/api/products/${productId}/image` : undefined,
            } as any;
        })
        .filter(Boolean) as any[];
};

export default function DeliveredPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingId, setPendingId] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const [productsData, ordersData] = await Promise.all([
                fetch("/api/products").then((r) => r.ok ? r.json() : []).catch(() => []),
                fetch("/api/orders?include=items_and_customizations&status=Pronto&sort=id&order=asc").then((r) => r.ok ? r.json() : []).catch(() => []),
            ]);

            const nameToId = new Map<string, number>();
            (productsData || []).forEach((p: any) => {
                if (p && p.name && p.id) nameToId.set(String(p.name).toLowerCase(), p.id);
            });

            // Build customization name lookup map (fallback)
            const productIds = new Set<number>();
            (ordersData || []).forEach((o: any) => {
                (o.items || []).forEach((item: any) => {
                    if (Array.isArray(item.customization_ids) && item.customization_ids.length > 0) {
                        const pid = Number(item.product_id ?? item.id);
                        if (pid) productIds.add(pid);
                    }
                });
            });
            const customizationNameMap: Record<number, Record<number, string>> = {};
            await Promise.all(
                Array.from(productIds).map(async (pid) => {
                    try {
                        const res = await fetch(`/api/products/${pid}/customizations`);
                        if (res.ok) {
                            const options: any[] = await res.json();
                            if (Array.isArray(options)) {
                                customizationNameMap[pid] = {};
                                options.forEach((opt: any) => {
                                    customizationNameMap[pid][Number(opt.id)] = String(opt.description ?? "");
                                });
                            }
                        }
                    } catch { /* ignore */ }
                }),
            );

            const mapped: Order[] = (ordersData || [])
                .map((o: any) => {
                    const items = mapOrderItems(o, nameToId, customizationNameMap);
                    const localItems = getLocalCustomizations(Number(o.id));
                    if (localItems.length > 0) {
                        items.forEach((item: any, idx: number) => {
                            if (idx < localItems.length && localItems[idx].customizationDescs.length > 0) {
                                item.customizations = localItems[idx].customizationDescs.map((desc, i) => ({
                                    id: localItems[idx].customizationIds[i] ?? 0,
                                    description: desc,
                                }));
                            }
                        });
                    }
                    return { id: o.id, prioridade: !!o.priority, status: o.status, items: groupItems(items) };
                });

                if (mounted) setOrders(sortOrders(mapped));
            })().catch((err) => console.error("Failed to load orders", err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const handleDeliver = async (id: number) => {
        try {
            let res = await fetch(`/api/orders/${id}/Entregue`, { method: "PATCH" });
            if (res.status === 404) {
                res = await fetch(`/api/order/${id}/Entregue`, { method: "PATCH" });
            }
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
