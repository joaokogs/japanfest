"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchStocks, createStockMovement } from "@/lib/api";
import type { Product } from "@/lib/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, Package } from "lucide-react";

const MOVEMENT_TYPES = ["Entrada de Estoque", "Ajuste"] as const;

interface StockRow {
  product: Product;
  quantity: number;
}

export default function StockMovementTab() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [movementType, setMovementType] = useState<string>("Entrada de Estoque");
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [products, stocks] = await Promise.all([
        fetchProducts(),
        fetchStocks(),
      ]);
      const stockMap = new Map<number, number>();
      for (const s of stocks) stockMap.set(s.product_id, s.quantity);
      setRows(
        products.map((p) => ({
          product: p,
          quantity: stockMap.get(p.id) ?? 0,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.product.name.toLowerCase().includes(q) ||
        r.product.category?.toLowerCase().includes(q) ||
        String(r.product.id).includes(q),
    );
  }, [rows, searchQuery]);

  const openDialog = (type: string, row: StockRow) => {
    setMovementType(type);
    setSelected(row);
    setInputValue("");
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selected || !inputValue.trim()) return;

    const value = parseInt(inputValue.trim(), 10);
    if (isNaN(value) || value <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }

    const qty = movementType === "Ajuste" ? -value : value;

    setSubmitting(true);
    try {
      await createStockMovement({
        product_id: selected.product.id,
        quantity: qty,
        type: movementType,
      });

      const stocks = await fetchStocks();
      const stockMap = new Map<number, number>();
      for (const s of stocks) stockMap.set(s.product_id, s.quantity);

      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          quantity: stockMap.get(r.product.id) ?? r.quantity,
        })),
      );

      toast.success("Estoque movimentado!", {
        description: `${selected.product.name}: ${selected.quantity} → ${stockMap.get(selected.product.id) ?? selected.quantity}`,
      });
      setDialogOpen(false);
    } catch (err) {
      toast.error("Erro ao movimentar estoque", {
        description:
          err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="stock-movement-container">
        <div className="stock-movement-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="stock-movement-skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-movement-container">
        <div className="stock-movement-error">
          <p>{error}</p>
          <button onClick={load} className="stock-movement-retry-btn">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stock-movement-container">
        <div className="stock-movement-search">
          <Search size={18} className="stock-movement-search-icon" />
          <input
            type="text"
            placeholder="Buscar produto por nome, categoria ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="stock-movement-search-input"
            aria-label="Buscar produtos"
          />
        </div>

        {rows.length === 0 ? (
          <div className="stock-movement-empty">
            <Package size={48} />
            <p>Nenhum produto cadastrado.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="stock-movement-empty">
            <Search size={48} />
            <p>
              Nenhum produto encontrado para &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          <div className="stock-movement-list">
            {filtered.map((row) => (
              <div key={row.product.id} className="stock-movement-item">
                <img
                  src={`/api/products/${row.product.id}/image`}
                  alt={row.product.name}
                  className="stock-movement-thumb"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/160x120?text=${encodeURIComponent(row.product.name.charAt(0))}`;
                  }}
                />
                <div className="stock-movement-info">
                  <div className="stock-movement-name">
                    {row.product.name}
                  </div>
                  <div className="stock-movement-detail">
                    {row.product.category && (
                      <span>{row.product.category}</span>
                    )}
                    {row.product.category && (
                      <span className="stock-movement-dot">·</span>
                    )}
                    <span>
                      Estoque: <strong>{row.quantity}</strong>
                    </span>
                  </div>
                </div>
                <div className="stock-movement-actions">
                  <button
                    type="button"
                    className="stock-movement-btn add"
                    onClick={() => openDialog("Entrada de Estoque", row)}
                    aria-label={`Entrada de estoque de ${row.product.name}`}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="stock-movement-btn remove"
                    onClick={() => openDialog("Ajuste", row)}
                    aria-label={`Ajustar estoque de ${row.product.name}`}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={
            movementType === "Entrada de Estoque"
              ? "stock-movement-dialog--entrada"
              : "stock-movement-dialog--ajuste"
          }
        >
          <DialogHeader>
            <div className="stock-movement-dialog-header-row">
              <span
                className={
                  movementType === "Entrada de Estoque"
                    ? "stock-movement-dialog-icon entrada"
                    : "stock-movement-dialog-icon ajuste"
                }
              >
                {movementType === "Entrada de Estoque" ? (
                  <Plus size={20} />
                ) : (
                  <Minus size={20} />
                )}
              </span>
              <div>
                <DialogTitle>
                  {movementType === "Entrada de Estoque"
                    ? "Entrada de Estoque"
                    : "Ajuste de Estoque"}
                </DialogTitle>
                <DialogDescription>
                  {selected && (
                    <>
                      Produto: <strong>{selected.product.name}</strong>
                      {" · "}
                      Estoque atual: <strong>{selected.quantity}</strong>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="stock-movement-dialog-field">
            <label
              htmlFor="movement-type"
              className="stock-movement-dialog-label"
            >
              Tipo de movimentação
            </label>
            <select
              id="movement-type"
              className="stock-movement-dialog-select"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              aria-label="Tipo de movimentação"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="stock-movement-dialog-field">
            <label htmlFor="stock-qty" className="stock-movement-dialog-label">
              Quantidade
            </label>
            <input
              id="stock-qty"
              type="number"
              min="1"
              className="stock-movement-dialog-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleConfirm();
              }}
              placeholder="Ex: 10"
              autoFocus
              aria-label="Quantidade"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting || !inputValue.trim()}
              className={
                movementType === "Entrada de Estoque"
                  ? "stock-movement-btn-confirm entrada"
                  : "stock-movement-btn-confirm ajuste"
              }
            >
              {submitting
                ? "Salvando..."
                : movementType === "Entrada de Estoque"
                  ? "Adicionar"
                  : "Ajustar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
