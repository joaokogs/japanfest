"use client";

import type { MergedOrder } from "@/lib/types";
import "@/app/admin/admin.css";

interface OrderTableProps {
  orders: MergedOrder[];
  onOrderClick: (order: MergedOrder) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function renderSummary(items: MergedOrder["items"]): string {
  if (!items || items.length === 0) return "—";
  const names = items.slice(0, 2).map((i) => `${i.quantity}x ${i.name}`);
  const extra = items.length > 2 ? ` +${items.length - 2} itens` : "";
  return names.join(", ") + extra;
}

function totalQty(items: MergedOrder["items"]): number {
  return items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

function statusClass(status: string): string {
  const key = status.toLowerCase().trim();
  if (key === "fila") return "fila";
  if (key === "pronto") return "pronto";
  if (key === "entregue") return "entregue";
  if (key === "cancelado") return "cancelado";
  return "";
}

export default function OrderTable({ orders, onOrderClick }: OrderTableProps) {
  return (
    <div className="admin-card">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>Pedido</th>
            <th>Status</th>
            <th className="admin-hide-mobile">Data</th>
            <th>Itens</th>
            <th className="admin-hide-mobile" style={{ width: 60, textAlign: "center" }}>Qtd</th>
            <th style={{ width: 90 }}>Prioridade</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const qtd = totalQty(order.items);
            return (
              <tr
                key={order.id}
                className="admin-clickable"
                onClick={() => onOrderClick(order)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOrderClick(order);
                  }
                }}
                aria-label={`Pedido #${order.id}, status ${order.status}`}
              >
                <td className="admin-mono" style={{ fontWeight: 700, fontSize: 14 }}>
                  #{order.id}
                </td>
                <td>
                  <span className={`admin-status-badge ${statusClass(order.status)}`}>
                    <span className="admin-status-dot" aria-hidden="true" />
                    {order.status}
                  </span>
                </td>
                <td className="admin-hide-mobile admin-text-muted">
                  {formatDate(order.date)}
                </td>
                <td>
                  <span className="admin-order-summary">{renderSummary(order.items)}</span>
                </td>
                <td className="admin-hide-mobile" style={{ textAlign: "center", fontSize: 13, color: "#888" }}>
                  {qtd}
                </td>
                <td>
                  {order.priority && (
                    <span className="admin-priority-badge">Prioridade</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
