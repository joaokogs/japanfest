"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface ImageUploaderProps {
  value: File | null;
  preview: string | null;
  error?: string;
  onChange: (file: File | null, preview: string | null) => void;
}

const MAX_SIZE = 5 * 1024 * 1024;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  preview,
  error,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || internalError;

  useEffect(() => {
    if (error) {
      setInternalError(null);
    }
  }, [error]);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Apenas arquivos de imagem são permitidos.";
    }
    if (file.size > MAX_SIZE) {
      return "A imagem deve ter no máximo 5 MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setInternalError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setInternalError(validationError);
        onChange(null, null);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      onChange(file, objectUrl);
    },
    [validateFile, onChange],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      onChange(null, null);
      setInternalError(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [preview, onChange],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (value) {
        handleRemove(e);
      }
    }
  };

  const borderStyle = displayError
    ? "2px solid #c0392b"
    : value
      ? "2px solid #f08918"
      : isDragging
        ? "2px dashed #f08918"
        : "2px dashed #ddd";

  const bgStyle = displayError
    ? "#fdf0ed"
    : isDragging
      ? "#fff8f0"
      : value
        ? "#fff"
        : "#fafafa";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        role="button"
        tabIndex={0}
        aria-label={value ? "Imagem selecionada. Clique para alterar ou pressione Delete para remover." : "Clique ou arraste uma imagem para fazer upload"}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: "relative",
          width: "100%",
          minHeight: 160,
          borderRadius: 12,
          border: borderStyle,
          background: bgStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleInputChange}
          aria-hidden="true"
        />

        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview da imagem selecionada"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleRemove(e);
                }
              }}
              aria-label="Remover imagem"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                zIndex: 2,
              }}
            >
              &#x2715;
            </button>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              color: displayError ? "#c0392b" : "#aaa",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Clique para selecionar ou arraste uma imagem
            </span>
            <span style={{ fontSize: 11, color: displayError ? "#c0392b" : "#ccc" }}>
              PNG, JPG ou WEBP · Máximo 5 MB
            </span>
          </div>
        )}
      </div>

      {displayError && (
        <span
          role="alert"
          style={{
            color: "#c0392b",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {displayError}
        </span>
      )}
    </div>
  );
};
