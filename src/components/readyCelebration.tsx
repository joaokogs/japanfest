"use client";

import React, { useEffect, useMemo, useRef } from "react";

type ReadyCelebrationProps = {
  label: string;
  onDone: () => void;
  durationMs?: number;
  fontScale?: number;
};

const BG_COLORS = [
  "#e63946", "#2a9d8f", "#e9c46a", "#264653", "#8338ec",
  "#f72585", "#06d6a0", "#ff6b35", "#3a86ff", "#fb5607",
];

type Shape = {
  id: number;
  kind: "circle" | "square" | "triangle" | "star";
  size: number;
  left: number;  
  delay: number;  
  duration: number; 
  color: string;
  rotate: number;
};

const SHAPE_COLORS = [
  "rgba(255,255,255,0.18)",
  "rgba(255,255,255,0.12)",
  "rgba(255,255,255,0.22)",
  "rgba(0,0,0,0.10)",
  "rgba(255,255,255,0.09)",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export const ReadyCelebration: React.FC<ReadyCelebrationProps> = ({ label, onDone, durationMs = 4000, fontScale = 1 }) => {
  const safeDurationMs = Math.min(Math.max(durationMs, 1000), 15000);
  const onDoneRef = useRef(onDone);
  const bg = useMemo(
    () => BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
    [label]
  );

  const shapes = useMemo<Shape[]>(() => {
    const kinds: Shape["kind"][] = ["circle", "square", "triangle", "star"];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      kind: kinds[i % kinds.length],
      size: Math.round(randomBetween(40, 140)),
      left: Math.round(randomBetween(0, 95)),
      delay: parseFloat(randomBetween(0, 2).toFixed(2)),
      duration: parseFloat(randomBetween(3.5, 7).toFixed(2)),
      color: SHAPE_COLORS[i % SHAPE_COLORS.length],
      rotate: Math.round(randomBetween(0, 360)),
    }));
  }, [label]);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), safeDurationMs);
    return () => clearTimeout(timer);
  }, [label, safeDurationMs]);

  const renderShape = (s: Shape) => {
    const base: React.CSSProperties = {
      position: "absolute",
      bottom: "-160px",
      left: `${s.left}%`,
      width: s.size,
      height: s.size,
      opacity: 0,
      animation: `floatUp ${s.duration}s ${s.delay}s ease-in-out infinite`,
      transform: `rotate(${s.rotate}deg)`,
      pointerEvents: "none",
    };

    if (s.kind === "circle") {
      return <div key={s.id} style={{ ...base, borderRadius: "50%", background: s.color }} />;
    }
    if (s.kind === "square") {
      return <div key={s.id} style={{ ...base, borderRadius: 8, background: s.color }} />;
    }
    if (s.kind === "triangle") {
      return (
        <div
          key={s.id}
          style={{
            ...base,
            width: 0,
            height: 0,
            background: "transparent",
            borderLeft: `${s.size / 2}px solid transparent`,
            borderRight: `${s.size / 2}px solid transparent`,
            borderBottom: `${s.size}px solid ${s.color}`,
          }}
        />
      );
    }
    return (
      <div
        key={s.id}
        style={{
          ...base,
          background: s.color,
          clipPath:
            "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
        }}
      />
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        animation: "fadeInCel 0.3s ease",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {shapes.map(renderShape)}
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 14 * fontScale,
            fontWeight: 700,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 6 * fontScale,
            textTransform: "uppercase",
          }}
        >
          PRONTO! &nbsp;•&nbsp; 出来
        </div>

        <div
          style={{
            fontSize: `clamp(${120 * fontScale}px, ${22 * fontScale}vw, ${260 * fontScale}px)`,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: -6,
            textShadow: "0 8px 40px rgba(0,0,0,0.25)",
            animation: "popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 18 * fontScale,
            fontWeight: 500,
            color: "rgba(255,255,255,0.70)",
            letterSpacing: 1 * fontScale,
          }}
        >
          Retire seu pedido no balcão
        </div>
      </div>

      <style>{`
        @keyframes fadeInCel {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0)   rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ReadyCelebration;
