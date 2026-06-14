"use client";

import React, { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/imageUploader";
import { ManageCustomizations } from "@/components/manageCustomizations";
import "./create-products.css";

interface FormState {
  name: string;
  category: string;
  price: string;
  priority: boolean;
  customizable: boolean;
  image: File | null;
  imagePreview: string | null;
}

const INITIAL_FORM: FormState = {
  name: "",
  category: "",
  price: "",
  priority: false,
  customizable: false,
  image: null,
  imagePreview: null,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const TABS = ["Novo Produto", "Customizações"] as const;
type Tab = (typeof TABS)[number];

export default function CreateProductsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Novo Produto");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [customizations, setCustomizations] = useState<string[]>([]);
  const [newCustomization, setNewCustomization] = useState("");
  const [customizationInputError, setCustomizationInputError] = useState<string | null>(null);
  const [customizationsSubmitted, setCustomizationsSubmitted] = useState(false);
  const customizationInputRef = useRef<HTMLInputElement>(null);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (key === "customizable" && !value) {
        setCustomizations([]);
        setNewCustomization("");
      }
    },
    [],
  );

  const handleImageChange = useCallback(
    (file: File | null, preview: string | null) => {
      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: preview,
      }));
      setErrors((prev) => {
        if (!prev.image) return prev;
        const next = { ...prev };
        delete next.image;
        return next;
      });
    },
    [],
  );

  const handleAddCustomization = () => {
    const desc = newCustomization.trim();
    if (!desc) {
      setCustomizationInputError("Descrição é obrigatória.");
      return;
    }
    if (desc.length < 2) {
      setCustomizationInputError("Descrição deve ter pelo menos 2 caracteres.");
      return;
    }
    setCustomizations((prev) => [...prev, desc]);
    setNewCustomization("");
    setCustomizationInputError(null);
    customizationInputRef.current?.focus();
  };

  const handleRemoveCustomization = (index: number) => {
    setCustomizations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCustomizationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomization();
    }
  };

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    const name = form.name.trim();
    if (!name) {
      next.name = "Nome é obrigatório.";
    } else if (name.length < 2) {
      next.name = "Nome deve ter pelo menos 2 caracteres.";
    } else if (name.length > 50) {
      next.name = "Nome deve ter no máximo 50 caracteres.";
    }

    const category = form.category.trim();
    if (!category) {
      next.category = "Categoria é obrigatória.";
    } else if (category.length < 2) {
      next.category = "Categoria deve ter pelo menos 2 caracteres.";
    } else if (category.length > 30) {
      next.category = "Categoria deve ter no máximo 30 caracteres.";
    }

    const priceStr = form.price.trim();
    if (!priceStr) {
      next.price = "Preço é obrigatório.";
    } else {
      const normalized = priceStr.replace(",", ".");
      const parsed = parseFloat(normalized);
      if (isNaN(parsed) || parsed <= 0) {
        next.price = "Informe um valor válido maior que zero.";
      }
    }

    if (!form.image) {
      next.image = "Imagem do produto é obrigatória.";
    } else if (form.image.size > MAX_IMAGE_SIZE) {
      next.image = "A imagem deve ter no máximo 5 MB.";
    } else if (!form.image.type.startsWith("image/")) {
      next.image = "Apenas arquivos de imagem são permitidos.";
    }

    if (form.customizable && customizations.length === 0) {
      next.customizations = "Adicione pelo menos uma opção de personalização.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, customizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setCustomizationsSubmitted(false);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("category", form.category.trim());
      formData.append("price", String(parseFloat(form.price.replace(",", "."))));
      formData.append("priority", String(form.priority));
      formData.append("customizable", String(form.customizable));
      if (form.image) {
        formData.append("image_data", form.image);
      }

      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const product = await res.json();
        const productId = Number(product.id);

        if (form.customizable && customizations.length > 0) {
          const results = await Promise.allSettled(
            customizations.map((desc) =>
              fetch("/api/products/customizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId, description: desc }),
              }),
            ),
          );

          const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
          if (failed.length === 0) {
            toast.success("Produto e customizações criados com sucesso!", {
              description: form.name.trim(),
            });
          } else {
            toast.success("Produto criado, mas algumas customizações falharam.", {
              description: `${failed.length} de ${customizations.length} falharam.`,
            });
          }
        } else {
          toast.success("Produto criado com sucesso!", {
            description: form.name.trim(),
          });
        }

        if (form.imagePreview) {
          URL.revokeObjectURL(form.imagePreview);
        }
        setForm(INITIAL_FORM);
        setCustomizations([]);
        setNewCustomization("");
        setCustomizationInputError(null);
        setCustomizationsSubmitted(true);
        setErrors({});
      } else {
        const body = await res.text();
        toast.error("Erro ao criar produto", {
          description: body || `Status ${res.status}`,
        });
      }
    } catch {
      toast.error("Erro ao criar produto", {
        description: "Não foi possível conectar ao servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  const errorId = (field: string) => `${field}-error`;

  return (
    <div className="create-products-root">
      <div className="create-products-container">
        <h1 className="create-products-title">Produtos</h1>

        <div className="create-products-tabs" role="tablist" aria-label="Seções">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`create-products-tab${activeTab === tab ? " active" : ""}`}
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Novo Produto" && (
          <form
            className="create-products-form"
            onSubmit={handleSubmit}
            noValidate
            style={loading ? { pointerEvents: "none", opacity: 0.7 } : undefined}
          >
            <div className="create-products-grid">
              <div className="create-products-field">
                <label htmlFor="name" className="create-products-label">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  className={`create-products-input${errors.name ? " error" : ""}`}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  maxLength={50}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? errorId("name") : undefined}
                  placeholder="Nome do produto"
                  autoComplete="off"
                />
                {errors.name && (
                  <span id={errorId("name")} className="create-products-error" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="create-products-field">
                <label htmlFor="category" className="create-products-label">
                  Categoria
                </label>
                <input
                  id="category"
                  type="text"
                  className={`create-products-input${errors.category ? " error" : ""}`}
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  maxLength={30}
                  aria-required="true"
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? errorId("category") : undefined}
                  placeholder="Ex: Bebidas"
                  autoComplete="off"
                />
                {errors.category && (
                  <span id={errorId("category")} className="create-products-error" role="alert">
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="create-products-field">
                <label htmlFor="price" className="create-products-label">
                  Preço
                </label>
                <input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  className={`create-products-input${errors.price ? " error" : ""}`}
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? errorId("price") : undefined}
                  placeholder="Ex: 29,90"
                  autoComplete="off"
                />
                {errors.price && (
                  <span id={errorId("price")} className="create-products-error" role="alert">
                    {errors.price}
                  </span>
                )}
              </div>
            </div>

            <div className="create-products-grid">
              <div className="create-products-field">
                <span className="create-products-label">Prioridade</span>
                <div className="create-products-toggle" role="group" aria-label="Prioridade do produto">
                  <button
                    type="button"
                    className={`create-products-toggle-btn ${form.priority ? "on" : "off"}`}
                    onClick={() => updateField("priority", true)}
                    aria-pressed={form.priority}
                    aria-label="Sim, prioritário"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className={`create-products-toggle-btn ${!form.priority ? "on" : "off"}`}
                    onClick={() => updateField("priority", false)}
                    aria-pressed={!form.priority}
                    aria-label="Não, sem prioridade"
                  >
                    Não
                  </button>
                </div>
              </div>

              <div className="create-products-field">
                <span className="create-products-label">Personalizável</span>
                <div className="create-products-toggle" role="group" aria-label="Produto personalizável">
                  <button
                    type="button"
                    className={`create-products-toggle-btn ${form.customizable ? "on" : "off"}`}
                    onClick={() => updateField("customizable", true)}
                    aria-pressed={form.customizable}
                    aria-label="Sim, personalizável"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className={`create-products-toggle-btn ${!form.customizable ? "on" : "off"}`}
                    onClick={() => updateField("customizable", false)}
                    aria-pressed={!form.customizable}
                    aria-label="Não, sem personalização"
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>

            {form.customizable && (
              <div className="create-products-customization-section">
                <span className="create-products-label">Opções de Personalização</span>
                <p className="create-products-customization-hint">
                  Adicione as opções que o cliente poderá escolher (ex: "Borda recheada", "Sem cebola")
                </p>

                <div className="create-products-customization-row">
                  <label htmlFor="new-customization" className="sr-only">
                    Nova opção de personalização
                  </label>
                  <input
                    ref={customizationInputRef}
                    id="new-customization"
                    type="text"
                    className="create-products-input"
                    value={newCustomization}
                    onChange={(e) => {
                      setNewCustomization(e.target.value);
                      setCustomizationInputError(null);
                    }}
                    onKeyDown={handleCustomizationKeyDown}
                    placeholder="Ex: Borda recheada"
                    aria-label="Nova opção de personalização"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="create-products-add-btn"
                    onClick={handleAddCustomization}
                    aria-label="Adicionar opção"
                  >
                    Adicionar
                  </button>
                </div>
                {customizationInputError && (
                  <span className="create-products-error" role="alert">
                    {customizationInputError}
                  </span>
                )}

                {customizations.length > 0 ? (
                  <div className="create-products-customization-list">
                    {customizations.map((desc, index) => (
                      <div key={index} className="create-products-customization-chip">
                        <span>{desc}</span>
                        <button
                          type="button"
                          className="create-products-chip-remove"
                          onClick={() => handleRemoveCustomization(index)}
                          aria-label={`Remover "${desc}"`}
                        >
                          &#x2715;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="create-products-customization-empty">
                    Nenhuma opção adicionada ainda.
                  </p>
                )}

                {errors.customizations && (
                  <span className="create-products-error" role="alert">
                    {errors.customizations}
                  </span>
                )}
              </div>
            )}

            <div className="create-products-grid">
              <div className="create-products-field full-width">
                <span className="create-products-label">Imagem do Produto</span>
                <ImageUploader
                  value={form.image}
                  preview={form.imagePreview}
                  error={errors.image}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="create-products-submit"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Produto"}
            </button>
          </form>
        )}

        {activeTab === "Customizações" && (
          <ManageCustomizations key={customizationsSubmitted ? "submitted" : "idle"} />
        )}
      </div>
    </div>
  );
}
