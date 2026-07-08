"use client";

import React, { useState, useEffect } from "react";
import { ProductsCard } from "@/components/productsCard";
import { toast } from "sonner";
import { mockApi, MOCK_PRODUCTS, type MockProduct } from "@/lib/mockData";
import "./losses.css";

type LossEntry = {
	productId: number;
	quantity: number;
	unitPrice: number;
};

type LossType = "Staff" | "Perda" ;

const LOSS_TYPES: LossType[] = ["Staff", "Perda"];

const ALL_FILTER = "todos";

const normalizeCategory = (value: string) => value.trim().toLowerCase();

const toCategoryLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function LossesPage() {
	const [filter, setFilter] = useState<string>(ALL_FILTER);
	const [categories, setCategories] = useState<string[]>([]);
	const [entries, setEntries] = useState<LossEntry[]>([]);
	const [products, setProducts] = useState<MockProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [lossType, setLossType] = useState<LossType>("Staff");
	const [showConfirm, setShowConfirm] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			try {
				const productsData = await mockApi.getProducts();
				const resolvedCategories = MOCK_PRODUCTS
					.map((p) => p.category)
					.filter((c, i, arr) => c && arr.indexOf(c) === i && c.toLowerCase() !== "todos");

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
		return () => { isMounted = false; };
	}, []);

	const quantities: Record<number, number> = {};
	for (const entry of entries) {
		quantities[entry.productId] = (quantities[entry.productId] ?? 0) + entry.quantity;
	}

	const handleQuantityChange = (id: number, newQuantity: number) => {
		setEntries((prev) => {
			const existing = prev.find((e) => e.productId === id);
			const currentTotal = existing?.quantity ?? 0;

			if (newQuantity > currentTotal) {
				const product = products.find((p) => p.id === id);
				if (!product) return prev;
				const diff = newQuantity - currentTotal;
				if (existing) {
					return prev.map((e) =>
						e.productId === id ? { ...e, quantity: e.quantity + diff } : e,
					);
				}
				return [...prev, { productId: id, quantity: diff, unitPrice: product.price }];
			}

			if (newQuantity < currentTotal) {
				if (existing) {
					if (newQuantity <= 0) {
						return prev.filter((e) => e.productId !== id);
					}
					return prev.map((e) =>
						e.productId === id ? { ...e, quantity: newQuantity } : e,
					);
				}
			}

			return prev;
		});
	};

	const filteredProducts = products
		.filter(
			(product) => filter === ALL_FILTER || normalizeCategory(product.category ?? "") === normalizeCategory(filter),
		)
		.map((product) => ({ ...product, customizable: false }));

	const total = Number(
		entries.reduce((sum, e) => sum + e.quantity * e.unitPrice, 0).toFixed(2),
	);

	const totalItemsCount = entries.reduce((s, e) => s + e.quantity, 0);

	const resetEntries = () => setEntries([]);

	const handleSubmit = async () => {
		if (total <= 0) return;
		setSubmitting(true);
		try {
			setShowConfirm(false);
			resetEntries();
			toast.success("Perda registrada com sucesso!");
		} catch {
			toast.error("Não foi possível conectar ao servidor.");
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
							<h2 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>Registro de Perda</h2>
							{totalItemsCount > 0 ? (
								<span style={{ fontSize: 13, fontWeight: 600, color: "#555", background: "#f3f3f3", borderRadius: 8, padding: "4px 8px" }}>{totalItemsCount} itens</span>
							) : null}
						</div>

						<div style={{ flex: 1, overflowY: "auto", paddingRight: 6 }}>
							{entries.length === 0 ? (
								<p style={{ color: "#aaa", fontSize: 14 }}>Nenhum item selecionado.</p>
							) : (
								<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
									{entries.map((entry) => {
										const product = products.find((p) => p.id === entry.productId);
										const itemTotal = entry.quantity * entry.unitPrice;
										return (
											<div key={entry.productId} style={{ background: "#fafafa", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
												<div style={{ flex: 1, minWidth: 0 }}>
													<p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#222" }}>{product?.name ?? `Produto #${entry.productId}`}</p>
													<p style={{ margin: 0, fontSize: 12, color: "#888" }}>{entry.quantity}x R$ {entry.unitPrice.toFixed(2).replace(".", ",")}</p>
												</div>
												<span style={{ fontWeight: 700, fontSize: 14, color: "#c0392b", whiteSpace: "nowrap" }}>R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
											</div>
										);
									})}
								</div>
							)}
						</div>

						<div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
							<div style={{ marginBottom: 12 }}>
								<label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 }}>
									Tipo de Perda
								</label>
								<select
									value={lossType}
									onChange={(e) => setLossType(e.target.value as LossType)}
									style={{
										width: "100%",
										height: 42,
										borderRadius: 8,
										border: "1px solid #ddd",
										padding: "0 12px",
										fontSize: 14,
										color: "#222",
										background: "#fff",
										outline: "none",
									}}
								>
									{LOSS_TYPES.map((type) => (
										<option key={type} value={type}>{type}</option>
									))}
								</select>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
								<strong style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>Total</strong>
								<strong style={{ color: "#c0392b", fontSize: 20 }}>R$ {total.toFixed(2).replace(".", ",")}</strong>
							</div>

							<button
								onClick={() => {
									if (total <= 0) return;
									setShowConfirm(true);
								}}
								style={{
									width: "100%",
									padding: "12px 0",
									borderRadius: 8,
									border: "none",
									background: total > 0 ? "#c0392b" : "#e6e6e6",
									color: total > 0 ? "#fff" : "#999",
									fontWeight: 700,
									fontSize: 16,
									cursor: total > 0 ? "pointer" : "default",
								}}
							>
								Registrar Perda
							</button>
						</div>
						<div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 12 }}>DJ COACH COMPANY</div>
					</div>
				</div>
			</div>

			{showConfirm && (
				<div
					style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
					onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
				>
					<div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
						<h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#222" }}>Confirmar Perda</h2>
						<p style={{ margin: "0 0 24px", fontSize: 14, color: "#666" }}>
							Confirmar registro de perda de <strong>{totalItemsCount} itens</strong> no valor total de <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>?
						</p>
						<p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>
							Tipo: <strong>{lossType}</strong>
						</p>
						<div style={{ display: "flex", gap: 10 }}>
							<button
								onClick={() => setShowConfirm(false)}
								style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
							>
								Cancelar
							</button>
							<button
								onClick={handleSubmit}
								disabled={submitting}
								style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: !submitting ? "#c0392b" : "#e6e6e6", color: !submitting ? "#fff" : "#999", fontWeight: 700, fontSize: 14, cursor: !submitting ? "pointer" : "default" }}
							>
								{submitting ? "Registrando..." : "Confirmar Perda"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
