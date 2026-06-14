"use client";

import "@/app/admin/admin.css";

function statusClass(status: string): string {
  const key = status.toLowerCase().trim();
  if (key === "fila") return "fila";
  if (key === "pronto") return "pronto";
  if (key === "entregue") return "entregue";
  if (key === "cancelado") return "cancelado";
  return "";
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`admin-status-badge ${statusClass(status)}`}>
      <span className="admin-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
