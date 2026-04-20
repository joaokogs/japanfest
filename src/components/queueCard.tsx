"use client";

import React from "react";

type QueueCardProps = {
  label: string;
  ready?: boolean;
  size?: number; // square size in px
  fontScale?: number; // multiplier for label font size
};

export const QueueCard: React.FC<QueueCardProps> = ({ label, ready = false, size = 140, fontScale = 1 }) => {
  const sideColor = ready ? "#f08918" : "#d0d0d0";

  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "stretch" }}>
      <div style={{ width: Math.max(10, Math.floor(size * 0.08)), background: sideColor, borderRadius: "8px 0 0 8px" }} />
      <div style={{
        flex: 1,
        background: "#fff",
        borderRadius: "0 8px 8px 0",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(22, Math.floor(size / 2.6 * fontScale)),
        fontWeight: 800,
        color: "#000",
      }}>
        {label}
      </div>
    </div>
  );
};

export default QueueCard;
