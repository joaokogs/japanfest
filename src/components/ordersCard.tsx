
import React from "react";

type OrderStatus = "NOVO" | "RECENTE" | "EM PREPARO";

type OrderItem = {
	name: string;
	quantity: number;
	note?: string;
};

type Order = {
	id: number;
	table?: string;
	isTakeout?: boolean;
	status: OrderStatus;
	time: string;
	items: OrderItem[];
};

type OrdersCardProps = {
	order: Order;
	onCancel?: () => void;
	onFinish?: () => void;
};

export const OrdersCard: React.FC<OrdersCardProps> = ({ order, onCancel, onFinish }) => {
	return (
		<div
			style={{
				color: "#333",
				border: "1px solid #f5a623",
				borderRadius: 16,
				background: "#fff",
				minWidth: 340,
				maxWidth: 400,
				margin: 8,
				boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
				position: "relative",
				display: "flex",
				flexDirection: "column",
				padding: 0,
				height: 340,
				overflow: "hidden"
			}}
		>
			<div
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					bottom: 0,
					width: 5,
					background: "#f5a623",
					borderTopLeftRadius: 16,
					borderBottomLeftRadius: 16,
				}}
			/>
			<div style={{ flex: 1, padding: "32px 28px 100px 36px", zIndex: 1 }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
					<span style={{ color: "#f5a623", fontWeight: 600, fontSize: 14 }}>
						{order.isTakeout ? "PARA VIAGEM" : `MESA ${order.table}`}
					</span>
					<span style={{ color: "#888", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
						<span role="img" aria-label="clock">⏱️</span> {order.time}
					</span>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
					<span style={{ fontWeight: 700, fontSize: 44 }}>#{order.id}</span>
					{order.status === "NOVO" && (
						<span style={{ background: "#ff9800", color: "#fff", borderRadius: 4, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>NOVO</span>
					)}
					{order.status === "RECENTE" && (
						<span style={{ background: "#f5a623", color: "#fff", borderRadius: 4, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>RECENTE</span>
					)}
					{order.status === "EM PREPARO" && (
						<span style={{ background: "#bdbdbd", color: "#fff", borderRadius: 4, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>EM PREPARO</span>
					)}
				</div>
				<div style={{ marginBottom: 0 }}>
					{order.items.map((item, idx) => (
						<div key={idx} style={{ marginBottom: 8 }}>
							<span style={{ fontWeight: 600, fontSize: 16 }}>{item.quantity}x {item.name}</span>
							{item.note && (
								<div style={{ fontSize: 13, color: "#888", marginLeft: 18 }}>{item.note}</div>
							)}
						</div>
					))}
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					padding: "0 28px 28px 36px",
					background: "#fff",
					borderBottomLeftRadius: 16,
					borderBottomRightRadius: 16,
					zIndex: 2,
				}}
			>
				<div style={{ display: "flex", gap: 14 }}>
					<button
						style={{
							flex: 1,
							border: "1px solid #bdbdbd",
							background: "#fff",
							color: "#888",
							borderRadius: 6,
							padding: "14px 0",
							fontWeight: 600,
							fontSize: 16,
							cursor: "pointer"
						}}
						onClick={onCancel}
					>
						ANULAR
					</button>
					<button
						style={{
							flex: 1,
							border: "none",
							background: "#f5a623",
							color: "#fff",
							borderRadius: 6,
							padding: "14px 0",
							fontWeight: 600,
							fontSize: 16,
							cursor: "pointer"
						}}
						onClick={onFinish}
					>
						CONCLUIR
					</button>
				</div>
			</div>
		</div>
	);
};

export const mockOrders: Order[] = [
	{
		id: 410,
		isTakeout: true,
		status: "RECENTE",
		time: "00:12",
		items: [
			{ name: "Burger Culinary Atelier", quantity: 3 },
			{ name: "Batatas Trufadas", quantity: 3 }
		]
	},
	{
		id: 402,
		table: "12",
		status: "NOVO",
		time: "14:22",
		items: [
			{ name: "Wagyu Tartare", quantity: 2, note: "Sem Cebolinha" },
			{ name: "Risoto de Trufas", quantity: 1, note: "Extra Parmesão" }
		]
	},
	{
		id: 405,
		table: "04",
		status: "EM PREPARO",
		time: "08:15",
		items: [
			{ name: "Vieiras Grelhadas", quantity: 4 },
			{ name: "Confit de Pato", quantity: 1 }
		]
	},
	{
		id: 408,
		table: "09",
		status: "NOVO",
		time: "02:44",
		items: [
			{ name: "Ribeye Maturado", quantity: 1, note: "AO PONTO P/ MAL" }
		]
	}
];
