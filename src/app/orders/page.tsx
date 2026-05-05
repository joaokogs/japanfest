"use client";

import { useCallback, useEffect, useState } from "react";
import { OrdersCard, Order } from "@/components/ordersCard";
import Dialog from "@/components/dialog";
import {
	getOfflineOrdersByStatus,
	subscribeToOfflineOrders,
	updateOfflineOrderStatus,
} from "@/lib/offlineStore";
import { toast } from "sonner";

const sortOrders = (arr: Order[]) =>
	[...arr].sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade ? -1 : 1));

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [pendingId, setPendingId] = useState<number | null>(null);

	const refreshOrders = useCallback(async () => {
		try {
			const data = await getOfflineOrdersByStatus("Fila");
			const mapped: Order[] = data.map((order) => ({
				id: order.id,
				prioridade: order.priority,
				status: order.status,
				items: order.items.map((item) => ({
					name: item.name,
					quantity: item.quantity,
					image: item.image,
				})),
			}));
			setOrders(sortOrders(mapped));
		} catch (error) {
			console.error("Falha ao carregar pedidos offline", error);
		}
	}, []);

	const handleMarkAsReady = async (id: number) => {
		try {
			const updated = await updateOfflineOrderStatus(id, "Pronto");
			if (!updated) return;
			toast.success(`Pedido #${id} está pronto!`);
		} catch (error) {
			console.error("Falha ao atualizar pedido offline", error);
		}
	};

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			await refreshOrders();
			if (mounted) setLoading(false);
		};
		void load();
		return () => {
			mounted = false;
		};
	}, [refreshOrders]);

	useEffect(() => subscribeToOfflineOrders(() => void refreshOrders()), [refreshOrders]);

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
				onConfirm={() => {
					if (pendingId !== null) handleMarkAsReady(pendingId).finally(() => setPendingId(null));
				}}
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
