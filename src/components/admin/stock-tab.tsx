"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProducts, fetchStocks } from "@/lib/api";
import type { Product, StockEntry } from "@/lib/types";
import "@/app/admin/admin.css";

interface StockRow {
  product: Product;
  quantity: number;
}

function QtyBadge({ qty }: { qty: number }) {
  const cls = qty < 0 ? "negative" : qty === 0 ? "zero" : "positive";
  return <span className={`admin-qty-badge ${cls}`}>{qty}</span>;
}

export default function StockTab() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [products, stocks] = await Promise.all([fetchProducts(), fetchStocks()]);
      const stockMap = new Map<number, number>();
      for (const s of stocks) stockMap.set(s.product_id, s.quantity);
      setRows(products.map((p) => ({ product: p, quantity: stockMap.get(p.id) ?? 0 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
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

  if (rows.length === 0) {
    return (
      <div className="admin-empty">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p>Nenhum produto cadastrado no estoque.</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Produto</th>
            <th className="admin-hide-mobile">Categoria</th>
            <th className="admin-hide-mobile">Preço</th>
            <th style={{ textAlign: "right" }}>Estoque</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.product.id}>
              <td className="admin-text-muted admin-mono">{idx + 1}</td>
              <td>
                <div className="admin-product-cell">
                  <img
                    src={`/api/products/${row.product.id}/image`}
                    alt={row.product.name}
                    className="admin-thumb"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/160x120?text=${encodeURIComponent(row.product.name.charAt(0))}`;
                    }}
                  />
                  <div>
                    <div className="admin-product-name">{row.product.name}</div>
                    <div className="admin-product-id">ID: {row.product.id}</div>
                  </div>
                </div>
              </td>
              <td className="admin-hide-mobile" style={{ color: "#888", fontSize: 13 }}>
                {row.product.category || "—"}
              </td>
              <td className="admin-hide-mobile admin-mono" style={{ fontSize: 13 }}>
                R$ {row.product.price.toFixed(2).replace(".", ",")}
              </td>
              <td style={{ textAlign: "right" }}>
                <QtyBadge qty={row.quantity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
