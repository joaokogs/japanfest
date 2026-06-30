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
	customizable?: boolean;
};

type CartEntry = {
	key: string;
	productId: number;
	quantity: number;
	unitPrice: number;
	customizationIds: number[];
	customizationDescs: string[];
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

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

const parseCurrencyInput = (value: string) => {
	const cleaned = value.replace(/[^\d.,-]/g, "").trim();
	if (!cleaned) return 0;

	const lastComma = cleaned.lastIndexOf(",");
	const lastDot = cleaned.lastIndexOf(".");
	const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;

	let normalized = cleaned;
	if (decimalSeparator === ",") {
		normalized = cleaned.replace(/\./g, "").replace(",", ".");
	} else if (decimalSeparator === ".") {
		normalized = cleaned.replace(/,/g, "");
	} else {
		normalized = cleaned.replace(/[.,]/g, "");
	}

	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : 0;
};

export default function CreateOrdersPage() {
	const [filter, setFilter] = useState<string>(ALL_FILTER);
	const [categories, setCategories] = useState<string[]>([]);
	const [cartEntries, setCartEntries] = useState<CartEntry[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
	const [showCashDialog, setShowCashDialog] = useState(false);
	const [cashReceived, setCashReceived] = useState("");
	const [cashError, setCashError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [orderError, setOrderError] = useState<string | null>(null);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [removeProductId, setRemoveProductId] = useState<number | null>(null);
	const [showReceiptDialog, setShowReceiptDialog] = useState(false);
	const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

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

	// Derive quantities from cartEntries for ProductsCard display
	const quantities: Record<number, number> = {};
	for (const entry of cartEntries) {
		quantities[entry.productId] = (quantities[entry.productId] ?? 0) + entry.quantity;
	}

	const makeCartKey = (productId: number, customizationIds: number[]) => {
		const sorted = [...customizationIds].sort((a, b) => a - b);
		return `${productId}:${sorted.join(",")}`;
	};

	const handleQuantityChange = (id: number, newQuantity: number) => {
		setCartEntries((prev) => {
			const items = prev.filter((e) => e.productId === id);
			const total = items.reduce((s, e) => s + e.quantity, 0);
			if (newQuantity > total) {
				// Increment for non-customizable products
				const product = products.find((p) => p.id === id);
				if (!product || product.customizable) return prev;
				const key = makeCartKey(id, []);
				const existing = prev.find((e) => e.key === key);
				if (existing) {
					return prev.map((e) =>
						e.key === key ? { ...e, quantity: e.quantity + (newQuantity - total) } : e,
					);
				}
				return [...prev, { key, productId: id, quantity: newQuantity - total, unitPrice: product.price, customizationIds: [], customizationDescs: [] }];
			}
			if (newQuantity < total) {
				let toRemove = total - newQuantity;
				const updated = [...prev];
				for (let i = updated.length - 1; i >= 0 && toRemove > 0; i--) {
					if (updated[i].productId === id) {
						const removed = Math.min(updated[i].quantity, toRemove);
						updated[i] = { ...updated[i], quantity: updated[i].quantity - removed };
						toRemove -= removed;
						if (updated[i].quantity <= 0) updated.splice(i, 1);
					}
				}
				return updated;
			}
			return prev;
		});
	};

	const handleAddWithCustomizations = (productId: number, customizationIds: number[], customizationDescs: string[]) => {
		setCartEntries((prev) => {
			const product = products.find((p) => p.id === productId);
			if (!product) return prev;
			const key = makeCartKey(productId, customizationIds);
			const existing = prev.find((e) => e.key === key);
			if (existing) {
				return prev.map((e) =>
					e.key === key ? { ...e, quantity: e.quantity + 1 } : e,
				);
			}
			return [...prev, { key, productId, quantity: 1, unitPrice: product.price, customizationIds, customizationDescs }];
		});
	};

	// Remove modal handlers
	useEffect(() => {
		if (!showRemoveModal) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleCancelRemove();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [showRemoveModal]);

	const handleRemoveWithCustomizations = (productId: number) => {
		setRemoveProductId(productId);
		setShowRemoveModal(true);
	};

	const handleConfirmRemove = (entryKey: string) => {
		setCartEntries((prev) =>
			prev
				.map((e) => (e.key === entryKey ? { ...e, quantity: e.quantity - 1 } : e))
				.filter((e) => e.quantity > 0),
		);
		setShowRemoveModal(false);
		setRemoveProductId(null);
	};

	const handleCancelRemove = () => {
		setShowRemoveModal(false);
		setRemoveProductId(null);
	};

	const filteredProducts = products.filter(
		(product) => filter === ALL_FILTER || normalizeCategory(product.category ?? "") === normalizeCategory(filter),
	);

	const subtotal = cartEntries.reduce((sum, e) => sum + e.quantity * e.unitPrice, 0);

	const total = Number(subtotal.toFixed(2));
	const cashReceivedAmount = parseCurrencyInput(cashReceived);
	const cashChange = Math.max(cashReceivedAmount - total, 0);
	const missingAmount = Math.max(total - cashReceivedAmount, 0);

	const totalItemsCount = cartEntries.reduce((s, e) => s + e.quantity, 0);

	const closePaymentFlow = () => {
		setShowPaymentModal(false);
		setShowCashDialog(false);
		setSelectedPayment(null);
		setCashReceived("");
		setCashError(null);
		setOrderError(null);
	};

	const resetCart = () => {
		setCartEntries([]);
		setShowRemoveModal(false);
		setRemoveProductId(null);
	};

	const handleSubmitOrder = async () => {
		if (!selectedPayment) return;
		setSubmitting(true);
		setOrderError(null);
		try {
			const listItems = cartEntries.map((e) => ({
				id: e.productId,
				quantity: e.quantity,
				unit_price: e.unitPrice,
				customizations: e.customizationIds.length > 0 ? e.customizationIds : undefined,
			}));
			const payload = {
				list_items: listItems,
				payment_method: selectedPayment,
				total_price: total,
			};
			let res = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (res.status === 404) {
				res = await fetch("/api/order", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			}
			if (!res.ok) {
				const body = await res.text();
				console.error("API error", res.status, body);
				setOrderError(`Erro ${res.status}: ${body || "Falha ao criar pedido"}`);
				return;
			}
			const data = await res.json();
			// Store order customization info for the kitchen screen
			try {
				const stored = JSON.parse(localStorage.getItem("orderCustomizations") ?? "{}");
				stored[String(data.id)] = cartEntries.map((e) => ({
					productId: e.productId,
					quantity: e.quantity,
					unitPrice: e.unitPrice,
					customizationDescs: e.customizationDescs,
					customizationIds: e.customizationIds,
				}));
				localStorage.setItem("orderCustomizations", JSON.stringify(stored));
			} catch { /* localStorage unavailable */ }
			closePaymentFlow();
			setCreatedOrderId(data.id);
			setShowReceiptDialog(true);
		} catch (err) {
			setOrderError("N\u00E3o foi poss\u00EDvel conectar ao servidor.");
			console.error(err);
		} finally {
			setSubmitting(false);
		}
	};

	const handleConfirmPayment = () => {
		if (!selectedPayment || submitting) return;
		if (selectedPayment === "Dinheiro") {
			setShowCashDialog(true);
			setCashError(null);
			return;
		}
		handleSubmitOrder();
	};

	const handleConfirmCashPayment = () => {
		if (cashReceivedAmount < total) {
			setCashError("O valor recebido deve ser igual ou maior que o total do pedido.");
			return;
		}
		setCashError(null);
		handleSubmitOrder();
	};

	const finishOrder = () => {
		const orderId = createdOrderId;
		setShowReceiptDialog(false);
		setCreatedOrderId(null);
		resetCart();
		if (orderId) {
			toast.success(`Pedido #${orderId} enviado!`, {
				description: "Seu pedido j\u00E1 est\u00E1 sendo preparado.",
			});
		}
	};

	const handlePrintReceipt = async () => {
		if (!createdOrderId) return;
		try {
			await fetch(`/api/receipts?id=${createdOrderId}&type=receipt&status=printed`, {
				method: "PATCH",
			});
		} catch {}
		finishOrder();
	};

	const handleCloseReceipt = () => {
		finishOrder();
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
									onAddWithCustomizations={handleAddWithCustomizations}
									onRemoveWithCustomizations={handleRemoveWithCustomizations}
									initialQuantity={quantities[product.id] ?? 0}
									hasCustomizationsInCart={cartEntries.some((e) => e.productId === product.id && e.customizationIds.length > 0)}
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
						{cartEntries.length === 0 ? (
							<p style={{ color: "#aaa", fontSize: 14 }}>Nenhum item selecionado.</p>
						) : (
							<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
								{cartEntries.map((entry) => {
									const product = products.find((p) => p.id === entry.productId);
									const itemTotal = entry.quantity * entry.unitPrice;
									return (
										<div key={entry.key} style={{ background: "#fafafa", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
											<div style={{ flex: 1, minWidth: 0 }}>
												<p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#222", whiteSpace: "normal", overflowWrap: "break-word", wordBreak: "break-word" }}>{product?.name ?? `Produto #${entry.productId}`}</p>
												<p style={{ margin: 0, fontSize: 12, color: "#888" }}>{entry.quantity}x R$ {entry.unitPrice.toFixed(2).replace(".", ",")}</p>
												{entry.customizationDescs.length > 0 && (
													<p style={{ margin: "2px 0 0", fontSize: 11, color: "#f08918", fontStyle: "italic" }}>
														+ {entry.customizationDescs.join(", ")}
													</p>
												)}
											</div>
											<span style={{ fontWeight: 700, fontSize: 14, color: "#2e8b57", whiteSpace: "nowrap" }}>R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
										</div>
									);
								})}
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
								setOrderError(null);
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

		{/* Remove Customization Modal */}
		{showRemoveModal && removeProductId !== null && (
			<div
				style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center" }}
				onClick={(e) => { if (e.target === e.currentTarget) handleCancelRemove(); }}
			>
				<div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
					<h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#222" }}>
						Remover {products.find((p) => p.id === removeProductId)?.name ?? `Produto #${removeProductId}`}
					</h3>
					<p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
						Selecione qual variação deseja remover
					</p>
					<div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
						{cartEntries
							.filter((e) => e.productId === removeProductId)
							.map((entry) => (
								<button
									key={entry.key}
									onClick={() => handleConfirmRemove(entry.key)}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 10,
										padding: "12px 14px",
										borderRadius: 10,
										border: "1.5px solid #e8e8e8",
										background: "#fafafa",
										cursor: "pointer",
										width: "100%",
										textAlign: "left",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = "#e74c3c";
										e.currentTarget.style.background = "#fff5f5";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = "#e8e8e8";
										e.currentTarget.style.background = "#fafafa";
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										{entry.customizationDescs.length > 0 ? (
											<span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
												{entry.customizationDescs.join(", ")}
											</span>
										) : (
											<span style={{ fontSize: 13, fontWeight: 500, color: "#888", fontStyle: "italic" }}>
												Sem personalização
											</span>
										)}
										<div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{entry.quantity}x no carrinho</div>
									</div>
									<div style={{ fontSize: 12, fontWeight: 700, color: "#e74c3c", whiteSpace: "nowrap" }}>
										Remover 1
									</div>
								</button>
							))}
						{cartEntries.filter((e) => e.productId === removeProductId).length === 0 && (
							<div style={{ textAlign: "center", padding: 20, color: "#aaa", fontSize: 14 }}>
								Nenhum item deste produto no carrinho.
							</div>
						)}
					</div>
					<button
						onClick={handleCancelRemove}
						style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
					>
						Cancelar
					</button>
				</div>
			</div>
		)}

		{/* Payment Modal */}
		{showPaymentModal && (
			<div
				style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
				onClick={(e) => { if (e.target === e.currentTarget) closePaymentFlow(); }}
			>
				<div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
					<h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#222" }}>Forma de Pagamento</h2>
					<p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>Selecione como deseja pagar</p>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
						{PAYMENT_OPTIONS.map(({ key, icon }) => (
							<button
								key={key}
								onClick={() => {
									setSelectedPayment(key);
									if (key !== "Dinheiro") {
										setShowCashDialog(false);
										setCashError(null);
									}
								}}
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
							onClick={closePaymentFlow}
							style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
						>
							Cancelar
						</button>
						<button
							onClick={handleConfirmPayment}
							disabled={!selectedPayment || submitting}
							style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: selectedPayment && !submitting ? "#f08918" : "#e6e6e6", color: selectedPayment && !submitting ? "#fff" : "#999", fontWeight: 700, fontSize: 14, cursor: selectedPayment && !submitting ? "pointer" : "default" }}
						>
							{submitting ? "Enviando..." : "Confirmar Pedido"}
						</button>
					</div>
				</div>
			</div>
		)}

		{showPaymentModal && showCashDialog && selectedPayment === "Dinheiro" && (
			<div
				style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }}
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						setShowCashDialog(false);
						setCashError(null);
					}
				}}
			>
				<div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
					<h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#222" }}>Pagamento em Dinheiro</h3>
					<p style={{ margin: "0 0 18px", fontSize: 13, color: "#666" }}>
						Total do pedido: <strong style={{ color: "#f08918" }}>{formatCurrency(total)}</strong>
					</p>

					<label htmlFor="cash-received" style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#444" }}>
						Valor entregue
					</label>
					<input
						id="cash-received"
						type="text"
						inputMode="decimal"
						placeholder="Ex: 100,00"
						value={cashReceived}
						onChange={(e) => {
							setCashReceived(e.target.value);
							setCashError(null);
						}}
						style={{
							color: "#222",
							width: "100%",
							height: 44,
							borderRadius: 10,
							border: "1px solid #ddd",
							padding: "0 12px",
							fontSize: 15,
							outline: "none",
							marginBottom: 12,
						}}
					/>

					{cashReceived.trim() && (
						<div
							style={{
								marginBottom: 14,
								padding: "10px 12px",
								borderRadius: 8,
								background: cashReceivedAmount >= total ? "#effaf3" : "#fff5eb",
								color: cashReceivedAmount >= total ? "#2e8b57" : "#b25b00",
								fontSize: 14,
								fontWeight: 600,
							}}
						>
							{cashReceivedAmount >= total
								? `Troco: ${formatCurrency(cashChange)}`
								: `Falta: ${formatCurrency(missingAmount)}`}
						</div>
					)}

					{cashError && (
						<p style={{ margin: "0 0 12px", fontSize: 13, color: "#c0392b", background: "#fdf0ed", borderRadius: 8, padding: "10px 12px" }}>
							{cashError}
						</p>
					)}

					<div style={{ display: "flex", gap: 10 }}>
						<button
							onClick={() => {
								setShowCashDialog(false);
								setCashError(null);
							}}
							style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
						>
							Voltar
						</button>
						<button
							onClick={handleConfirmCashPayment}
							disabled={submitting}
							style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: !submitting ? "#f08918" : "#e6e6e6", color: !submitting ? "#fff" : "#999", fontWeight: 700, fontSize: 14, cursor: !submitting ? "pointer" : "default" }}
						>
							{submitting ? "Enviando..." : "Confirmar Pedido"}
						</button>
					</div>
				</div>
			</div>
		)}

		{/* Receipt Dialog */}
		{showReceiptDialog && createdOrderId && (
			<div
				style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center" }}
				onClick={(e) => { if (e.target === e.currentTarget) handleCloseReceipt(); }}
			>
				<div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
					<div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F5A8;</div>
					<h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#222" }}>Imprimir Via da Cozinha</h2>
					<p style={{ margin: "0 0 24px", fontSize: 14, color: "#666" }}>
						Deseja imprimir a nota do pedido <strong>#{createdOrderId}</strong>?
					</p>
					<div style={{ display: "flex", gap: 10 }}>
						<button
							onClick={handleCloseReceipt}
							style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
						>
							Fechar
						</button>
						<button
							onClick={handlePrintReceipt}
							style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: "#f08918", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
						>
							Imprimir
						</button>
					</div>
				</div>
			</div>
		)}

		</>
	);
}
