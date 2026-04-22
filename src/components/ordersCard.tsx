
import React from "react";

type OrderStatus = "NOVO" | "RECENTE" | "EM PREPARO";

export type OrderItem = {
	name: string;
	quantity: number;
	note?: string;
	image?: string;
};

export type Order = {
	id: number;
	table?: string;
	prioridade?: boolean;
	status?: string;
	items: OrderItem[];
};

type OrdersCardProps = {
	order: Order;
	onCancel?: () => void;
	onFinish?: () => void;
	buttonLabel?: string;
};

export const OrdersCard: React.FC<OrdersCardProps> = ({ order, onFinish, buttonLabel = "Marcar como Pronto" }) => {
	const accent = order.prioridade ? '#4caf50' : '#f5a623';

	return (
		<div
			style={{
				color: "#333",
				border: `1px solid ${accent}`,
				borderRadius: 16,
				background: "#fff",
			width: "100%",
				boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
				position: "relative",
				display: "flex",
				flexDirection: "column",
				padding: 0,
				minHeight: 260,
				height: "100%",
				boxSizing: "border-box",
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
					background: accent,
					borderTopLeftRadius: 16,
					borderBottomLeftRadius: 16,
					zIndex: 3,
				}}
			/>
			<div style={{ flex: 1, padding: "32px 28px 100px 36px", zIndex: 1 }}>
				<div style={{ marginBottom: 12 }} />
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<span style={{ fontWeight: 700, fontSize: 44 }}>#{order.id}</span>
						{order.prioridade && (
							<span style={{ background: accent, color: "#fff", borderRadius: 4, padding: "4px 8px", fontSize: 13, fontWeight: 600 }}>Prioridade</span>
						)}
					</div>
				</div>
				<div style={{ marginBottom: 0 }}>
					{order.items.map((item, idx) => (
						<div key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
							<img
								src={item.image ?? `https://placehold.co/160x120?text=${encodeURIComponent(item.name)}`}
								alt={item.name}
								loading="lazy"
								style={{
									width: 35,
									height: 35,
									objectFit: "cover",
									borderRadius: 8,
									flex: "none",
									border: "1px solid #eee",
									boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
									background: "#fafafa",
								}}
							/>
							<div>
								<span style={{ fontWeight: 600, fontSize: 16 }}>{item.quantity}x {item.name}</span>
								{item.note && (
									<div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{item.note}</div>
								)}
							</div>
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
				<div style={{ display: "flex" }}>
					<button
						style={{
							flex: 1,
							border: "none",
							background: accent,
							color: "#fff",
							borderRadius: 6,
							padding: "14px 0",
							fontWeight: 600,
							fontSize: 16,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8
						}}
						onClick={onFinish}
						aria-label="Marcar como Pronto"
					>
						<svg role="img" aria-label="Ícone de concluído" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} style={{ display: "inline-block" }}>
							<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
						</svg>
						<span>{buttonLabel}</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export const mockOrders: Order[] = [
	{
		id: 410,
		prioridade: true,
		status: "RECENTE",
		items: [
			{ name: "Burger Culinary Atelier", quantity: 3 },
			{ name: "Batatas Trufadas", quantity: 3 }
		]
	},
	{
		id: 402,
		table: "12",
		status: "NOVO",
		items: [
			{ name: "Wagyu Tartare", quantity: 2, note: "Sem Cebolinha" },
			{ name: "Risoto de Trufas", quantity: 1, note: "Extra Parmesão" }
		]
	},
	{
		id: 405,
		table: "04",
		status: "EM PREPARO",
		items: [
			{ name: "Vieiras Grelhadas", quantity: 4 },
			{ name: "Confit de Pato", quantity: 1 }
		]
	},
	{
		id: 408,
		table: "09",
		status: "NOVO",
		items: [
			{ name: "Ribeye Maturado", quantity: 1, note: "AO PONTO P/ MAL" }
		]
	}
];
