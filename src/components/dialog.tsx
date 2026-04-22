"use client";

import React, { useEffect } from "react";

export type DialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description?: string;
	icon?: React.ReactNode;
	iconBg?: string;
	confirmLabel?: string;
	confirmColor?: string;
	confirmTextColor?: string;
	cancelLabel?: string;
	cancelColor?: string;
	cancelTextColor?: string;
	cancelBorderColor?: string;
	showConfirm?: boolean;
	showCancel?: boolean;
};

export const Dialog: React.FC<DialogProps> = ({
	open,
	onClose,
	onConfirm,
	title,
	description,
	icon,
	iconBg = "#f5a62322",
	confirmLabel = "Confirmar",
	confirmColor = "#f5a623",
	confirmTextColor = "#fff",
	cancelLabel = "Cancelar",
	cancelColor = "#fff",
	cancelTextColor = "#555",
	cancelBorderColor = "#ddd",
	showConfirm = true,
	showCancel = true,
}) => {
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 99999,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
			}}
		>
			<div
				onClick={onClose}
				style={{
					position: "absolute",
					inset: 0,
					background: "rgba(0,0,0,0.45)",
					backdropFilter: "blur(3px)",
				}}
			/>

			<div
				style={{
					position: "relative",
					background: "#fff",
					borderRadius: 20,
					padding: "36px 32px 28px",
					width: "100%",
					maxWidth: 400,
					boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 0,
				}}
			>
				{icon && (
					<div
						style={{
							width: 64,
							height: 64,
							borderRadius: "50%",
							background: iconBg,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginBottom: 20,
							flexShrink: 0,
						}}
					>
						{icon}
					</div>
				)}

				<div
					id="dialog-title"
					style={{
						fontWeight: 700,
						fontSize: 18,
						color: "#111",
						textAlign: "center",
						marginBottom: description ? 8 : 24,
					}}
				>
					{title}
				</div>

				{description && (
					<div
						style={{
							fontSize: 14,
							color: "#777",
							textAlign: "center",
							lineHeight: 1.6,
							marginBottom: 28,
						}}
					>
						{description}
					</div>
				)}

				<div
					style={{
						display: "flex",
						gap: 10,
						width: "100%",
						marginTop: description ? 0 : 4,
					}}
				>
					{showCancel && (
						<button
							onClick={onClose}
							style={{
								flex: 1,
								padding: "12px 0",
								borderRadius: 10,
								border: `1px solid ${cancelBorderColor}`,
								background: cancelColor,
								color: cancelTextColor,
								fontWeight: 600,
								fontSize: 15,
								cursor: "pointer",
							}}
						>
							{cancelLabel}
						</button>
					)}
					{showConfirm && (
						<button
							onClick={() => { onConfirm(); onClose(); }}
							style={{
								flex: 1,
								padding: "12px 0",
								borderRadius: 10,
								border: "none",
								background: confirmColor,
								color: confirmTextColor,
								fontWeight: 600,
								fontSize: 15,
								cursor: "pointer",
							}}
						>
							{confirmLabel}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Dialog;
