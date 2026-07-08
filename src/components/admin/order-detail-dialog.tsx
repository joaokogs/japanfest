"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/api";
import type { MergedOrder } from "@/lib/types";
import "@/app/admin/admin.css";

interface Props {
  order: MergedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: () => void;
}

const STATUS_OPTIONS = ["Fila", "Pronto", "Entregue", "Cancelado"];

function statusClass(status: string): string {
  const key = status.toLowerCase().trim();
  if (key === "fila") return "fila";
  if (key === "pronto") return "pronto";
  if (key === "entregue") return "entregue";
  if (key === "cancelado") return "cancelado";
  return "";
}

export default function OrderDetailDialog({ order, open, onOpenChange, onStatusChanged }: Props) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [changing, setChanging] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => { setSelectedStatus(""); }, [order?.id]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!order) return null;

  const handleChangeStatus = async () => {
    if (!selectedStatus) return;
    setChanging(true);
    try {
      await updateOrderStatus(order.id, selectedStatus);
      toast.success(`Pedido #${order.id} atualizado para "${selectedStatus}"`);
      onStatusChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setChanging(false);
    }
  };

  const handleCancel = async () => {
    try {
      await updateOrderStatus(order.id, "Cancelado");
      toast.success(`Pedido #${order.id} cancelado`);
      onStatusChanged();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar pedido");
    }
  };

  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => onOpenChange(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
            }}
          />

          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Pedido #${order.id}`}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 600,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
              padding: 0,
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: "#222" }}>
                  #{order.id}
                </span>
                <span className={`admin-status-badge ${statusClass(order.status)}`}>
                  <span className="admin-status-dot" aria-hidden="true" />
                  {order.status}
                </span>
                {order.priority && <span className="admin-priority-badge">Prioridade</span>}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>
                  {totalItems} item{totalItems !== 1 ? "ns" : ""}
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>
                Itens do Pedido
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex", gap: 12, padding: 12,
                      borderRadius: 10, border: "1px solid #f0f0f0", background: "#fafafa",
                    }}
                  >
                    <img
                      src={item.image ?? `https://placehold.co/160x120?text=${encodeURIComponent(item.name.charAt(0))}`}
                      alt={item.name}
                      style={{
                        width: 48, height: 48, borderRadius: 8,
                        objectFit: "cover", flexShrink: 0,
                        border: "1px solid #eee", background: "#f5f5f5",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/160x120?text=${encodeURIComponent(item.name.charAt(0))}`;
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{item.name}</span>
                        <span style={{
                          flexShrink: 0, background: "#fff8e1", color: "#e67e22",
                          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                        }}>
                          {item.quantity}x
                        </span>
                      </div>
                      {item.note && (
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#999", fontStyle: "italic" }}>
                          Obs: {item.note}
                        </p>
                      )}
                      {item.customizations && item.customizations.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {item.customizations.map((c) => (
                            <span
                              key={c.id}
                              style={{
                                padding: "2px 8px", borderRadius: 6,
                                background: "#fff8f0", border: "1px solid #f4d9c7",
                                fontSize: 11, color: "#666",
                              }}
                            >
                              {c.description}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!order.items || order.items.length === 0) && (
                  <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, padding: 16 }}>
                    Nenhum item registrado.
                  </p>
                )}
              </div>
            </div>

            {/* Change Status */}
            <div style={{ padding: "0 24px 20px" }}>
              <div style={{ borderRadius: 10, border: "1px solid #eee", padding: 16, background: "#fafafa" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px" }}>
                  Alterar Status
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                      flex: 1, minWidth: 160, height: 42,
                      borderRadius: 8, border: "1px solid #ddd",
                      padding: "0 12px", fontSize: 14, color: "#333",
                      background: "#fff", outline: "none",
                    }}
                    aria-label="Selecionar novo status"
                  >
                    <option value="">Selecione um status...</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleChangeStatus}
                    disabled={!selectedStatus || changing}
                    style={{
                      height: 42, padding: "0 20px",
                      borderRadius: 8, border: "none",
                      background: !selectedStatus || changing ? "#e6e6e6" : "#f08918",
                      color: !selectedStatus || changing ? "#999" : "#fff",
                      fontWeight: 700, fontSize: 14, cursor: !selectedStatus || changing ? "default" : "pointer",
                      transition: "background 0.2s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {changing ? "Alterando..." : "Alterar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            {order.status !== "Cancelado" && order.status !== "Entregue" && (
              <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setCancelConfirm(true)}
                  style={{
                    padding: "10px 20px", borderRadius: 8, border: "1px solid #f5c6c0",
                    background: "#fff", color: "#c0392b",
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  Cancelar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={() => setCancelConfirm(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            style={{
              position: "relative", background: "#fff", borderRadius: 16,
              padding: "28px 24px 20px", width: "100%", maxWidth: 380,
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "#fdf0ed",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 id="cancel-title" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#222" }}>
              Confirmar Cancelamento
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#888", lineHeight: 1.5 }}>
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setCancelConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 8,
                  border: "1px solid #ddd", background: "#f5f5f5",
                  fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#555",
                }}
              >
                Voltar
              </button>
              <button
                onClick={() => { handleCancel(); setCancelConfirm(false); }}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 8, border: "none",
                  background: "#c0392b", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
