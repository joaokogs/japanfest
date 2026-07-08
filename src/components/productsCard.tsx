"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

type CustomizationOption = {
	id: number;
	description: string;
};

type Product = {
	id: number;
	name: string;
	price: number;
	category?: string;
	priority?: boolean;
	customizable?: boolean;
};

type ProductsCardProps = {
	product: Product;
	onQuantityChange?: (id: number, quantity: number) => void;
	onAddWithCustomizations?: (productId: number, customizationIds: number[], customizationDescs: string[]) => void;
	onRemoveWithCustomizations?: (productId: number) => void;
	initialQuantity?: number;
	hasCustomizationsInCart?: boolean;
};

export const ProductsCard: React.FC<ProductsCardProps> = ({
	product,
	onQuantityChange,
	onAddWithCustomizations,
	onRemoveWithCustomizations,
	initialQuantity = 0,
	hasCustomizationsInCart = false,
}) => {
	const [quantity, setQuantity] = useState<number>(initialQuantity ?? 0);
	const [showModal, setShowModal] = useState(false);
	const [customizations, setCustomizations] = useState<CustomizationOption[]>([]);
	const [selectedCustomizations, setSelectedCustomizations] = useState<number[]>([]);
	const [loadingCustomizations, setLoadingCustomizations] = useState(false);
	const mountedRef = useRef(true);

	useEffect(() => {
		setQuantity(initialQuantity ?? 0);
	}, [initialQuantity]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!showModal) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleCancelCustomizations();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [showModal]);

	const handleDecrement = () => {
		if (product.customizable && quantity > 0 && hasCustomizationsInCart) {
			onRemoveWithCustomizations?.(product.id);
		} else {
			const next = Math.max(0, quantity - 1);
			setQuantity(next);
			onQuantityChange?.(product.id, next);
		}
	};

	const openCustomizationModal = useCallback(async () => {
		setShowModal(true);
		setLoadingCustomizations(true);
		setSelectedCustomizations([]);
		try {
			const res = await fetch(`/api/products/${product.id}/customizations`);
			if (!mountedRef.current) return;
			if (res.ok) {
				const data: CustomizationOption[] = await res.json();
				if (!mountedRef.current) return;
				setCustomizations(Array.isArray(data) ? data : []);
			} else {
				setCustomizations([]);
			}
		} catch {
			if (mountedRef.current) setCustomizations([]);
		} finally {
			if (mountedRef.current) setLoadingCustomizations(false);
		}
	}, [product.id]);

	const handleIncrement = () => {
		if (product.customizable) {
			void openCustomizationModal();
		} else {
			const next = quantity + 1;
			setQuantity(next);
			onQuantityChange?.(product.id, next);
		}
	};

	const toggleCustomization = (id: number) => {
		setSelectedCustomizations((prev) =>
			prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
		);
	};

	const handleConfirmCustomizations = () => {
		const descs = selectedCustomizations.map(
			(id) => customizations.find((c) => c.id === id)?.description ?? "",
		);
		onAddWithCustomizations?.(product.id, selectedCustomizations, descs);
		const next = quantity + 1;
		setQuantity(next);
		setShowModal(false);
	};

	const handleCancelCustomizations = () => {
		setShowModal(false);
	};

	return (
		<>
			<div data-category={product.category ?? ""} className="product-card">
				<img
					src={`/api/products/${product.id}/image`}
					alt={product.name}
				/>
				<div className="title">{product.name}</div>
				{product.customizable && (
					<div
						style={{
							fontSize: 11,
							color: "#f08918",
							fontWeight: 600,
							marginTop: -4,
							marginBottom: 2,
							padding: "0 8px",
						}}
					>
						Personalizável
					</div>
				)}

				<div className="footer">
					<span className="price">R$ {product.price.toFixed(2).replace(".", ",")}</span>
					<div className="qty-controls">
						<div className="qty-pill">
							<button
								onClick={handleDecrement}
								style={{
									background: "transparent",
									border: "none",
									color: quantity === 0 ? "#d6a77a" : "#f5a623",
									fontWeight: 700,
									fontSize: 18,
									cursor: quantity === 0 ? "default" : "pointer",
									padding: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 24,
									height: 24,
								}}
								aria-label="Diminuir quantidade"
							>
								−
							</button>
							<span style={{ fontWeight: 600, fontSize: 15, minWidth: 28, textAlign: "center", color: "#222" }}>
								{quantity}
							</span>
							<button
								onClick={handleIncrement}
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									border: "none",
									background: "#f08918",
									color: "#fff",
									fontWeight: 700,
									fontSize: 18,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									lineHeight: 1,
								}}
								aria-label="Aumentar quantidade"
							>
								+
							</button>
						</div>
					</div>
				</div>
			</div>

			{showModal && (
				<div
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.45)",
						zIndex: 200,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					onClick={(e) => {
						if (e.target === e.currentTarget) handleCancelCustomizations();
					}}
				>
					<div
						style={{
							background: "#fff",
							borderRadius: 16,
							padding: 28,
							width: 400,
							maxWidth: "90vw",
							maxHeight: "80vh",
							display: "flex",
							flexDirection: "column",
							boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
						}}
					>
						<h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#222" }}>
							Personalizar {product.name}
						</h3>
						<p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
							Selecione as opções desejadas
						</p>

						{loadingCustomizations ? (
							<div style={{ textAlign: "center", padding: 20, color: "#888", fontSize: 14 }}>
								Carregando opções...
							</div>
						) : customizations.length === 0 ? (
							<div style={{ textAlign: "center", padding: 20, color: "#aaa", fontSize: 14 }}>
								Nenhuma opção de personalização disponível.
							</div>
						) : (
							<div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
								{customizations.map((opt) => {
									const isSelected = selectedCustomizations.includes(opt.id);
									return (
										<label
											key={opt.id}
											style={{
												display: "flex",
												alignItems: "center",
												gap: 10,
												padding: "10px 12px",
												borderRadius: 10,
												border: `1.5px solid ${isSelected ? "#f08918" : "#e8e8e8"}`,
												background: isSelected ? "#fff8f0" : "#fafafa",
												cursor: "pointer",
											}}
										>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleCustomization(opt.id)}
												style={{ accentColor: "#f08918", width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
											/>
											<span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: "#333" }}>
												{opt.description}
											</span>
										</label>
									);
								})}
							</div>
						)}

						<div style={{ display: "flex", gap: 10 }}>
							<button
								onClick={handleCancelCustomizations}
								style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "1px solid #e0e0e0", background: "#f5f5f5", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555" }}
							>
								Cancelar
							</button>
							<button
								onClick={handleConfirmCustomizations}
								disabled={loadingCustomizations || customizations.length === 0}
								style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: loadingCustomizations || customizations.length === 0 ? "#e6e6e6" : "#f08918", color: loadingCustomizations || customizations.length === 0 ? "#999" : "#fff", fontWeight: 700, fontSize: 14, cursor: loadingCustomizations || customizations.length === 0 ? "default" : "pointer" }}
							>
								Adicionar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
