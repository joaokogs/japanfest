"use client";

import React, { useState } from "react";

type Product = {
	id: number;
	name: string;
	price: number;
	category?: string;
	priority?: boolean;
};

type ProductsCardProps = {
	product: Product;
	onQuantityChange?: (id: number, quantity: number) => void;
	initialQuantity?: number;
};

export const ProductsCard: React.FC<ProductsCardProps> = ({ product, onQuantityChange, initialQuantity = 0 }) => {
	const [quantity, setQuantity] = useState<number>(initialQuantity ?? 0);

	React.useEffect(() => {
		setQuantity(initialQuantity ?? 0);
	}, [initialQuantity]);

	const handleDecrement = () => {
		const next = Math.max(0, quantity - 1);
		setQuantity(next);
		onQuantityChange?.(product.id, next);
	};

	const handleIncrement = () => {
		const next = quantity + 1;
		setQuantity(next);
		onQuantityChange?.(product.id, next);
	};

	return (
		<div data-category={product.category ?? ""} className="product-card">
			<img
				src={`/api/product/image/${product.id}`}
				alt={product.name}
			/>
			<div className="title">{product.name}</div>

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
	);
};



