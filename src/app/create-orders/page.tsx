"use client";

import React, { useState, useEffect } from "react";
import { ProductsCard } from "@/components/productsCard";
import { toast } from "sonner";
import "./create-orders.css";

type Product = {
	id: number;
	name: string;
	price: number;
	category: string;
	priority: boolean;
};

const ALL_FILTER = "todos";

const normalizeCategory = (value: string) => value.trim().toLowerCase();

const toCategoryLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const extractCategoryName = (item: unknown) => {
	if (typeof item === "string") return item;
	if (item && typeof item === "object") {
		const categoryObject = item as { name?: unknown; category?: unknown; label?: unknown; title?: unknown };
		const raw = categoryObject.name ?? categoryObject.category ?? categoryObject.label ?? categoryObject.title;
		return typeof raw === "string" ? raw : "";
	}
	return "";
};

const extractCategories = (payload: unknown): string[] => {
	const list = Array.isArray(payload)
		? payload
		: payload && typeof payload === "object" && Array.isArray((payload as { categories?: unknown }).categories)
			? ((payload as { categories: unknown[] }).categories ?? [])
			: [];
	const unique = new Map<string, string>();
	for (const item of list) {
		const name = extractCategoryName(item).trim();
		if (!name) continue;
		const normalized = normalizeCategory(name);
		if (!unique.has(normalized)) unique.set(normalized, name);
	}
	return Array.from(unique.values());
};

type PaymentMethod = "Cart\u00E3o de D\u00E9bito" | "Cart\u00E3o de Cr\u00E9dito" | "Pix" | "Dinheiro";

const PAYMENT_OPTIONS: { key: PaymentMethod; icon: string }[] = [
	{ key: "Cart\u00E3o de Cr\u00E9dito", icon: "\uD83D\uDCB3" },
	{ key: "Cart\u00E3o de D\u00E9bito", icon: "\uD83C\uDFE7" },
	{ key: "Pix", icon: "\uD83D\uDCF1" },
	{ key: "Dinheiro", icon: "\uD83D\uDCB5" },
];

export default function CreateOrdersPage() {
	const [filter, setFilter] = useState<string>(ALL_FILTER);
	const [categories, setCategories] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<Record<number, number>>({});
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [orderError, setOrderError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const [productsRes, categoriesRes] = await Promise.all([
					fetch("/api/products"),
					fetch("/api/products/categories"),
				]);

				const productsData: Product[] = productsRes.ok ? await productsRes.json() : [];
				const categoriesPayload: unknown = categoriesRes.ok ? await categoriesRes.json() : [];
				const categoryFromApi = extractCategories(categoriesPayload);
				const fallbackCategories = Array.from(
					new Set(
						productsData
							.map((product) => product.category?.trim())
							.filter((category): category is string => Boolean(category)),
					),
				);
				const resolvedCategories = (categoryFromApi.length > 0 ? categoryFromApi : fallbackCategories).filter(
					(category) => normalizeCategory(category) !== ALL_FILTER,
				);

				if (!isMounted) return;
				setProducts(productsData);
				setCategories(resolvedCategories);
			} catch (error) {
				console.error("Erro ao carregar produtos/categorias", error);
				if (!isMounted) return;
				setProducts([]);
				setCategories([]);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	const handleQuantityChange = (id: number, quantity: number) => {
		setQuantities((prev) => ({ ...prev, [id]: quantity }));
	};

	const filteredProducts = products.filter(
		(product) => filter === ALL_FILTER || normalizeCategory(product.category ?? "") === normalizeCategory(filter),
	);

	const subtotal = products.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * p.price, 0);

	const orderItems = products.filter((p) => (quantities[p.id] ?? 0) > 0);

	const total = Number(subtotal.toFixed(2));

	const totalItemsCount = Object.values(quantities).reduce((s, v) => s + (v ?? 0), 0);

	const handleSubmitOrder = async () => {
		if (!selectedPayment) return;
		setSubmitting(true);
		setOrderError(null);
		try {
			const listItems = orderItems.map((p) => ({
				id: p.id,
				quantity: quantities[p.id],
				unit_price: p.price,
			}));
			const res = await fetch("/api/order", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					list_items: listItems,
					payment_method: selectedPayment,
					total_price: total,
				}),
			});
			if (!res.ok) {
				const body = await res.text();
				console.error("API error", res.status, body);
				setOrderError(`Erro ${res.status}: ${body || "Falha ao criar pedido"}`);
				return;
			}
			const data = await res.json();
			setQuantities({});
			setShowPaymentModal(false);
			setSelectedPayment(null);
			toast.success(`Pedido #${data.id} enviado!`, {
				description: "Seu pedido j\u00E1 est\u00E1 sendo preparado.",
			});
		} catch (err) {
			setOrderError("N\u00E3o foi poss\u00EDvel conectar ao servidor.");
			console.error(err);
		} finally {
			setSubmitting(false);
		}
	};

	const filterLabels: { key: string; label: string }[] = [
		{ key: ALL_FILTER, label: "Todos" },
		...categories.map((category) => ({ key: category, label: toCategoryLabel(category) })),
	];

	if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Carregando produtos...</div>;

	return (
		<>
		<div className="create-orders-root">
			<div className="content">
					<div className="filters">
						<div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
							{filterLabels.map(({ key, label }) => (
								<button
									key={key}
									onClick={() => setFilter(key)}
									className="btn"
									style={{
										border: filter === key ? "none" : "1px solid rgba(0,0,0,0.06)",
										background: filter === key ? "#f08918" : "#efefef",
										color: filter === key ? "#fff" : "#444",
										fontWeight: filter === key ? 700 : 600,
										boxShadow: filter === key ? "0 6px 14px rgba(240,137,24,0.12)" : "none",
									}}
								>
									{label}
								</button>
							))}
						</div>
					</div>

					<div className="products-wrap">
						<div className="products-grid">
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

				<div className="sidebar">
					<div className="sidebar-panel">
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
								setShowPaymentModal(true);
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
					<div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 12 }}>DJ COACH COMPANY</div>
				</div>
			</div>
		</div>

		{/* Payment Modal */}
		{showPaymentModal && (
			<div
				style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
				onClick={(e) => { if (e.target === e.currentTarget) { setShowPaymentModal(false); setSelectedPayment(null); } }}
			>
				<div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
					<h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#222" }}>Forma de Pagamento</h2>
					<p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>Selecione como deseja pagar</p>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
						{PAYMENT_OPTIONS.map(({ key, icon }) => (
							<button
								key={key}
								onClick={() => setSelectedPayment(key)}
								style={{
									borderRadius: 12,
									border: selectedPayment === key ? "2.5px solid #f08918" : "2px solid #e8e8e8",
									background: selectedPayment === key ? "#fff8f0" : "#fafafa",
									padding: "18px 12px",
									cursor: "pointer",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: 8,
									transition: "all 0.15s",
								}}
							>
								<span style={{ fontSize: 28 }}>{icon}</span>
								<span style={{ fontSize: 13, fontWeight: 600, color: selectedPayment === key ? "#f08918" : "#444" }}>{key}</span>
							</button>
						))}
					</div>
					{orderError && (
						<p style={{ margin: "0 0 16px", fontSize: 13, color: "#c0392b", background: "#fdf0ed", borderRadius: 8, padding: "10px 12px" }}>{orderError}</p>
					)}
					<div style={{ display: "flex", gap: 10 }}>
						<button
							onClick={() => { setShowPaymentModal(false); setSelectedPayment(null); }}
							style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
						>
							Cancelar
						</button>
						<button
							onClick={handleSubmitOrder}
							disabled={!selectedPayment || submitting}
							style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: selectedPayment && !submitting ? "#f08918" : "#e6e6e6", color: selectedPayment && !submitting ? "#fff" : "#999", fontWeight: 700, fontSize: 14, cursor: selectedPayment && !submitting ? "pointer" : "default" }}
						>
							{submitting ? "Enviando..." : "Confirmar Pedido"}
						</button>
					</div>
				</div>
			</div>
		)}

		</>
	);
}
