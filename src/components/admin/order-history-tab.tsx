"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchOrdersWithItems, buildMergedOrders, filterLossOrders } from "@/lib/api";
import type { MergedOrder } from "@/lib/types";
import OrderTable from "./order-table";
import OrderDetailDialog from "./order-detail-dialog";
import "@/app/admin/admin.css";

export default function OrderHistoryTab() {
  const [orders, setOrders] = useState<MergedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MergedOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchOrdersWithItems();
      setOrders(await buildMergedOrders(filterLossOrders(raw)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="admin-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="admin-skeleton-row" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="admin-error-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p>{error}</p>
        <button onClick={load}>Tentar novamente</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="admin-empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p>Nenhum pedido encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <OrderTable orders={orders} onOrderClick={setSelectedOrder} />
      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}
        onStatusChanged={() => {
          toast.success("Status atualizado!");
          void load();
        }}
      />
    </>
  );
}
