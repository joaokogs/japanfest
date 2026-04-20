"use client";

import React, { useState } from "react";

type Product = {
	id: number;
	name: string;
	price: number;
	image: string;
	priority?: boolean; // true = bebida
};

type ProductsCardProps = {
	product: Product;
	onQuantityChange?: (id: number, quantity: number) => void;
};

export const ProductsCard: React.FC<ProductsCardProps> = ({ product, onQuantityChange }) => {
	const [quantity, setQuantity] = useState(0);

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
		<div
			data-priority={product.priority ? "true" : "false"}
			style={{
				width: 260,
				position: "relative",
				paddingBottom: 92,
				borderRadius: 8,
				background: "#fff",
				boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
				margin: 8,
			}}
		>
			<img
				src={product.image}
				alt={product.name}
				style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
			/>
			<div style={{ padding: "12px 14px 14px" }}>
				<span
					style={{
						fontWeight: 700,
						fontSize: 15,
						color: "#222",
						display: "block",
						whiteSpace: "normal",
						wordBreak: "break-word",
						lineHeight: 1.2,
						marginBottom: 8
					}}
				>
					{product.name}
				</span>
			</div>

			<div style={{
				position: "absolute",
				left: 0,
				right: 0,
				bottom: 0,
				padding: "12px 14px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				borderTop: "1px solid #eee",
				background: "#fff"
			}}>
				<span style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>
					R$ {product.price.toFixed(2).replace(".", ",")}
				</span>
				<div style={{ display: "flex", alignItems: "center" }}>
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
						padding: "6px 8px",
						borderRadius: 12,
						background: "#fff6f0",
						border: "1px solid #f4d9c7"
					}}>
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

export const mockProducts: Product[] = [
	{
		id: 1,
		name: "Suco de Amora Natural aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		price: 16.0,
		image: "https://placehold.co/400x300?text=Suco+de+Amora",
		priority: true,
	},
	{
		id: 2,
		name: "Carne",
		price: 10.0,
		image: "https://placehold.co/400x300?text=Água+de+Coco",
		priority: false,
	},
];

