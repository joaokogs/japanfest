"use client";

import React, { useState } from "react";
import { ProductsCard } from "@/components/productsCard";

type Product = {
	id: number;
	name: string;
	price: number;
	image: string;
	priority?: boolean;
};

const mockProducts: Product[] = [
	{
		id: 1,
		name: "Salada de Figos e Gorgonzola",
		price: 42.0,
		image: "https://placehold.co/400x300?text=Salada",
		priority: false,
	},
	{
		id: 2,
		name: "Risoto de Cogumelos Silvestres",
		price: 68.0,
		image: "https://placehold.co/400x300?text=Risoto",
		priority: false,
	},
	{
		id: 3,
		name: "Salmão ao Limão Siciliano",
		price: 84.0,
		image: "https://placehold.co/400x300?text=Salmão",
		priority: false,
	},
	{
		id: 4,
		name: "Suco de Amora Natural",
		price: 16.0,
		image: "https://placehold.co/400x300?text=Suco+de+Amora",
		priority: true,
	},
	{
		id: 5,
		name: "Água de Coco",
		price: 12.0,
		image: "https://placehold.co/400x300?text=Água+de+Coco",
		priority: true,
	},
	{
		id: 6,
		name: "Torta de Limão Siciliano",
		price: 28.0,
		image: "https://placehold.co/400x300?text=Torta+de+Limão",
		priority: false,
	},
];

type Filter = "todos" | "comida" | "bebida";

export default function CreateOrdersPage() {
	const [filter, setFilter] = useState<Filter>("todos");
	const [quantities, setQuantities] = useState<Record<number, number>>({});

	const handleQuantityChange = (id: number, quantity: number) => {
		setQuantities((prev) => ({ ...prev, [id]: quantity }));
	};

	const filteredProducts = mockProducts.filter((p) => {
		if (filter === "comida") return !p.priority;
		if (filter === "bebida") return p.priority;
		return true;
	});

	const subtotal = mockProducts.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * p.price, 0);

	const orderItems = mockProducts.filter((p) => (quantities[p.id] ?? 0) > 0);

	const total = Number(subtotal.toFixed(2));

	const totalItemsCount = Object.values(quantities).reduce((s, v) => s + (v ?? 0), 0);

	const filterLabels: { key: Filter; label: string }[] = [
		{ key: "todos", label: "Todos" },
		{ key: "comida", label: "Comidas" },
		{ key: "bebida", label: "Bebidas" },
	];

	return (
		<div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f7f7f5", fontFamily: "sans-serif" }}>
			<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
				<div style={{ padding: "32px 24px 0", flexShrink: 0 }}>
					<div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
						{filterLabels.map(({ key, label }) => (
							<button
								key={key}
								onClick={() => setFilter(key)}
								style={{
									padding: "8px 20px",
									borderRadius: 12,
									border: filter === key ? "none" : "1px solid rgba(0,0,0,0.06)",
									background: filter === key ? "#f08918" : "#efefef",
									color: filter === key ? "#fff" : "#444",
									fontWeight: filter === key ? 700 : 600,
									fontSize: 14,
									cursor: "pointer",
									transition: "all 0.15s",
									whiteSpace: "nowrap",
									boxShadow: filter === key ? "0 6px 14px rgba(240,137,24,0.12)" : "none",
								}}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px" }}>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
						{filteredProducts.map((product) => (
							<ProductsCard
								key={product.id}
								product={product}
								onQuantityChange={handleQuantityChange}
								initialQuantity={quantities[product.id] ?? 0}
							/>
						))}
					</div>
				</div>
			</div>

			<div style={{ width: 340, padding: 20, display: "flex", flexShrink: 0 }}>
				<div style={{ width: "100%", background: "#fff", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", height: "calc(100vh - 40px)" }}>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
						<h2 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>Resumo do Pedido</h2>
						{totalItemsCount > 0 ? (
							<span style={{ fontSize: 13, fontWeight: 600, color: "#555", background: "#f3f3f3", borderRadius: 8, padding: "4px 8px" }}>{totalItemsCount} itens</span>
						) : null}
					</div>

					<div style={{ flex: 1, overflowY: "auto", paddingRight: 6 }}>
						{orderItems.length === 0 ? (
							<p style={{ color: "#aaa", fontSize: 14 }}>Nenhum item selecionado.</p>
						) : (
							<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
								{orderItems.map((p) => (
									<div key={p.id} style={{ background: "#fafafa", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
										<div style={{ flex: 1, minWidth: 0 }}>
											<p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#222", whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "break-word" }}>{p.name}</p>
											<p style={{ margin: 0, fontSize: 12, color: "#888" }}>{quantities[p.id]}x R$ {p.price.toFixed(2).replace(".", ",")}</p>
										</div>
										<span style={{ fontWeight: 700, fontSize: 14, color: "#2e8b57", whiteSpace: "nowrap" }}>R$ {((quantities[p.id] ?? 0) * p.price).toFixed(2).replace(".", ",")}</span>
									</div>
								))}
							</div>
						)}
					</div>

					<div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
							<strong style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>Total</strong>
							<strong style={{ color: "#f08918", fontSize: 20 }}>R$ {total.toFixed(2).replace(".", ",")}</strong>
						</div>

						<button
							onClick={() => {
								if (total <= 0) return;
								// TODO: send order
								console.log('Finalizar pedido', { items: quantities, total });
							}}
							style={{
								width: "100%",
								padding: "12px 0",
								borderRadius: 8,
								border: "none",
								background: total > 0 ? "#f08918" : "#e6e6e6",
								color: total > 0 ? "#fff" : "#999",
								fontWeight: 700,
								fontSize: 16,
								cursor: total > 0 ? "pointer" : "default",
							}}
						>
							Finalizar Pedido
						</button>
					</div>
					<div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 12 }}>UM OFERECIMENTO DJ COACH</div>
				</div>
			</div>
		</div>
	);
}
