"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  priority: boolean;
  customizable: boolean;
};

type Customization = {
  id: number;
  description: string;
};

export const ManageCustomizations: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [newCustomization, setNewCustomization] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/products");
        if (!mounted) return;
        if (res.ok) {
          const data: Product[] = await res.json();
          setProducts(Array.isArray(data) ? data : []);
          setLoadError(null);
        } else {
          setProducts([]);
          setLoadError("Erro ao carregar produtos do servidor.");
        }
      } catch {
        if (mounted) {
          setProducts([]);
          setLoadError("Não foi possível conectar ao servidor.");
        }
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const loadCustomizations = useCallback(async (productId: number) => {
    setLoadingCustomizations(true);
    try {
      const res = await fetch(`/api/products/${productId}/customizations`);
      if (res.ok) {
        const data: Customization[] = await res.json();
        setCustomizations(Array.isArray(data) ? data : []);
      } else {
        setCustomizations([]);
      }
    } catch {
      setCustomizations([]);
    } finally {
      setLoadingCustomizations(false);
    }
  }, []);

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    setNewCustomization("");
    setInputError(null);
    if (productId > 0) {
      void loadCustomizations(productId);
    } else {
      setCustomizations([]);
    }
  };

  const handleAddCustomization = async () => {
    const desc = newCustomization.trim();
    if (!desc) {
      setInputError("Descrição é obrigatória.");
      return;
    }
    if (desc.length < 2) {
      setInputError("Descrição deve ter pelo menos 2 caracteres.");
      return;
    }
    if (!selectedProductId || selectedProductId <= 0) {
      setInputError("Selecione um produto primeiro.");
      return;
    }

    setAdding(true);
    setInputError(null);
    try {
      const res = await fetch("/api/products/customizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selectedProductId, description: desc }),
      });

      if (res.ok) {
        toast.success("Customização adicionada!", { description: desc });
        setNewCustomization("");
        void loadCustomizations(selectedProductId);
      } else {
        const body = await res.text();
        toast.error("Erro ao adicionar customização", {
          description: body || `Status ${res.status}`,
        });
      }
    } catch {
      toast.error("Erro ao adicionar customização", {
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAddCustomization();
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="manage-customizations">
      <h2 className="manage-customizations-title">Customizações de Produtos Existentes</h2>
      <p className="manage-customizations-hint">
        Selecione um produto personalizável para gerenciar suas opções.
      </p>

      <div className="manage-customizations-product-select">
        <label htmlFor="existing-product" className="create-products-label">
          Produto
        </label>
        {loadingProducts ? (
          <p className="manage-customizations-loading">Carregando produtos...</p>
        ) : loadError ? (
          <p className="manage-customizations-error" role="alert">{loadError}</p>
        ) : products.length === 0 ? (
          <p className="manage-customizations-empty">
            Nenhum produto encontrado.
          </p>
        ) : (
          <select
            id="existing-product"
            className="create-products-input"
            value={selectedProductId ?? ""}
            onChange={(e) => handleProductChange(Number(e.target.value))}
            aria-label="Selecione um produto"
          >
            <option value="">-- Selecione um produto --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.category}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedProduct && (
        <div className="manage-customizations-content">
          <div className="manage-customizations-header">
            <span className="manage-customizations-product-name">
              {selectedProduct.name}
            </span>
          </div>

          {loadingCustomizations ? (
            <p className="manage-customizations-loading">Carregando customizações...</p>
          ) : (
            <>
              {customizations.length > 0 ? (
                <div className="manage-customizations-list">
                  {customizations.map((c) => (
                    <div key={c.id} className="manage-customizations-item">
                      <span>{c.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="manage-customizations-empty">
                  Nenhuma opção de personalização cadastrada.
                </p>
              )}
            </>
          )}

          <div className="manage-customizations-add-row">
            <input
              type="text"
              className="create-products-input"
              value={newCustomization}
              onChange={(e) => {
                setNewCustomization(e.target.value);
                setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Nova opção de personalização"
              aria-label="Nova customização"
              disabled={adding}
              autoComplete="off"
            />
            <button
              type="button"
              className="create-products-add-btn"
              onClick={() => void handleAddCustomization()}
              disabled={adding}
            >
              {adding ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          {inputError && (
            <span className="create-products-error" role="alert">
              {inputError}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageCustomizations;
