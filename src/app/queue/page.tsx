"use client";

import React, { useState, useEffect, useRef } from "react";
import QueueCard from "@/components/queueCard";
import ReadyCelebration from "@/components/readyCelebration";

type OrderEventPayload = {
  id?: number | string;
  status?: string;
};

const toOrderId = (value: unknown) => String(value ?? "").trim();
const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();

const sortOrderIds = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean))).sort((a, b) => {
    const aa = Number(a);
    const bb = Number(b);
    if (Number.isFinite(aa) && Number.isFinite(bb)) return aa - bb;
    return a.localeCompare(b);
  });

const READY_CELEBRATION_TIMEOUT_MS = 5000;

export default function QueuePage() {
  const [ready, setReady] = useState<string[]>([]);
  const [preparing, setPreparing] = useState<string[]>([]);
  const [readyCelebrationQueue, setReadyCelebrationQueue] = useState<string[]>([]);
  const [activeCelebration, setActiveCelebration] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardSize, setCardSize] = useState<number>(140);
  const [pageFontScale, setPageFontScale] = useState<number>(1);
  const s = (n: number) => `${Math.round(n * pageFontScale)}px`;
  const readyRef = useRef<string[]>([]);
  const activeCelebrationRef = useRef<string | null>(null);
  const readyCelebrationQueueRef = useRef<string[]>([]);

  const enqueueReadyCelebration = (orderId: string) => {
    setReadyCelebrationQueue((prev) => {
      if (prev.includes(orderId)) return prev;
      if (activeCelebrationRef.current === orderId) return prev;
      if (readyRef.current.includes(orderId)) return prev;
      return [...prev, orderId];
    });
  };

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    activeCelebrationRef.current = activeCelebration;
  }, [activeCelebration]);

  useEffect(() => {
    readyCelebrationQueueRef.current = readyCelebrationQueue;
  }, [readyCelebrationQueue]);

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const r = await fetch("/api/orders");
        if (!r.ok) {
          const txt = await r.text().catch(() => "<no body>");
          console.error(`Failed to fetch /api/orders. HTTP ${r.status}`, txt);
          return null;
        }
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (!ct.includes("application/json")) {
          const text = await r.text().catch(() => "<unreadable>");
          console.error("/api/orders returned non-JSON:", text);
          return null;
        }
        const data: any[] = await r.json();
        return data || [];
      } catch (err) {
        console.error("Failed to load orders", err);
        return null;
      }
    };

    const applyOrders = (data: any[], triggerCelebration: boolean) => {
      const nextReady = sortOrderIds(
        (data || [])
          .filter((o: any) => o.status === "Pronto")
          .map((o: any) => String(o.id)),
      );
      const nextPreparing = sortOrderIds(
        (data || [])
          .filter((o: any) => o.status === "Fila")
          .map((o: any) => String(o.id)),
      );

      const pendingReady = new Set<string>(readyCelebrationQueueRef.current);
      if (activeCelebrationRef.current) pendingReady.add(activeCelebrationRef.current);

      if (triggerCelebration) {
        const previousReady = new Set<string>(readyRef.current);
        nextReady.forEach((id) => {
          if (!previousReady.has(id) && !pendingReady.has(id)) {
            enqueueReadyCelebration(id);
            pendingReady.add(id);
          }
        });
      }

      setReady(sortOrderIds(nextReady.filter((id) => !pendingReady.has(id))));
      setPreparing(sortOrderIds(nextPreparing.filter((id) => !pendingReady.has(id))));
    };

    const loadInitial = async () => {
      const data = await fetchOrders();
      if (!mounted || !data) return;
      applyOrders(data, false);
    };

    const refreshWithFallback = async () => {
      const data = await fetchOrders();
      if (!mounted || !data) return;
      applyOrders(data, true);
    };

    loadInitial();
    const intervalId = window.setInterval(() => {
      void refreshWithFallback();
    }, 3000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/events/orders");

    source.onmessage = (event) => {
      let payload: OrderEventPayload | null = null;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      const orderId = toOrderId(payload?.id);
      const status = normalizeStatus(payload?.status);
      if (!orderId || !status) return;

      if (status === "pronto") {
        enqueueReadyCelebration(orderId);
        return;
      }

      if (status === "fila" || status === "em preparo" || status === "preparando") {
        setReadyCelebrationQueue((prev) => prev.filter((id) => id !== orderId));
        if (activeCelebrationRef.current === orderId) setActiveCelebration(null);
        setReady((prev) => prev.filter((id) => id !== orderId));
        setPreparing((prev) => sortOrderIds([...prev, orderId]));
        return;
      }

      if (status === "entregue" || status === "cancelado") {
        setReadyCelebrationQueue((prev) => prev.filter((id) => id !== orderId));
        if (activeCelebrationRef.current === orderId) setActiveCelebration(null);
        setReady((prev) => prev.filter((id) => id !== orderId));
        setPreparing((prev) => prev.filter((id) => id !== orderId));
      }
    };

    source.onerror = (error) => {
      console.error("SSE /events/orders error", error);
    };

    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    if (activeCelebration || readyCelebrationQueue.length === 0) return;
    setActiveCelebration(readyCelebrationQueue[0]);
  }, [activeCelebration, readyCelebrationQueue]);

  const handleCelebrationDone = () => {
    if (!activeCelebration) return;
    const finishedId = activeCelebration;
    setActiveCelebration(null);
    setReadyCelebrationQueue((prev) => prev.filter((id) => id !== finishedId));
    setPreparing((prev) => prev.filter((id) => id !== finishedId));
    setReady((prev) => sortOrderIds([...prev, finishedId]));
  };

  return (
    <>
      {activeCelebration && (
        <ReadyCelebration
          label={activeCelebration}
          onDone={handleCelebrationDone}
          durationMs={READY_CELEBRATION_TIMEOUT_MS}
        />
      )}
      

      {settingsOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={() => setSettingsOpen(false)} />
          <div style={{ position: "relative", width: 520, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", zIndex: 10001 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>Configurações</div>
              <button onClick={() => setSettingsOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, color: "#000" }}>Tamanho do card</label>
                  <div style={{ textAlign: "right", fontWeight: 700, color: "#000" }}>{cardSize}px</div>
                </div>
                <input style={{ width: "100%" }} type="range" min={80} max={260} value={cardSize} onChange={(e) => setCardSize(Number(e.target.value))} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, color: "#000" }}>Tamanho da fonte da página</label>
                  <div style={{ textAlign: "right", fontWeight: 700, color: "#000" }}>{Math.round(pageFontScale * 100)}%</div>
                </div>
                <input style={{ width: "100%" }} type="range" min={80} max={200} value={Math.round(pageFontScale * 100)} onChange={(e) => setPageFontScale(Number(e.target.value) / 100)} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button onClick={() => setSettingsOpen(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #000", background: "#fff", color: "#000" }}>Cancelar</button>
              <button onClick={() => setSettingsOpen(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#f08918", color: "#fff", fontWeight: 700 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating gear button bottom-right */}
      <button
        onClick={() => setSettingsOpen(true)}
        aria-label="Abrir configurações"
        title="Configurações"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 10002,
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          color: "#000",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.28 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.28-.41 1.51-1a1.65 1.65 0 0 0-.33-1.82L4.3 5.28A2 2 0 0 1 7.12 2.45l.06.06c.5.5 1.28.69 1.97.47.68-.22 1.18-.88 1.18-1.61V1a2 2 0 0 1 4 0v.09c0 .73.5 1.39 1.18 1.61.69.22 1.47.03 1.97-.47l.06-.06A2 2 0 0 1 21.72 4.3l-.06.06c-.5.5-.69 1.28-.47 1.97.22.68.88 1.18 1.61 1.18H23a2 2 0 0 1 0 4h-.09c-.73 0-1.39.5-1.61 1.18-.22.69-.03 1.47.47 1.97z" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div
        style={{
          minHeight: "100vh",
          background: "#f7f7f7",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${16 * pageFontScale}px`,
        }}
      >
          

        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 0,
            padding: "32px 40px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, marginRight: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: s(45), fontWeight: 800, color: "#f08918" }}>
                  Pronto
                </span>
                <span
                  style={{ fontSize: s(32), fontWeight: 500, color: "#000", marginLeft: 8 }}
                >
                  (出来)
                </span>
              <div
                style={{
                  height: 3,
                  background: "#f08918",
                  borderRadius: 4,
                  marginTop: 8,
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {ready.map((label) => (
                    <QueueCard key={label} label={label} ready size={cardSize} fontScale={cardSize / 140} />
                  ))}
            </div>
          </div>

          <div
            style={{
              width: 1,
              background: "#ddd",
              alignSelf: "stretch",
              margin: "0 8px",
            }}
          />

          <div style={{ flex: 1, marginLeft: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: s(45), fontWeight: 800, color: "#000" }}>
                Preparando
              </span>
              <span
                style={{ fontSize: s(32), fontWeight: 500, color: "#000", marginLeft: 8 }}
              >
                (準備)
              </span>
              <div
                style={{
                  height: 3,
                  background: "#d0d0d0",
                  borderRadius: 4,
                  marginTop: 8,
                }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {preparing.map((label) => (
                  <QueueCard key={label} label={label} ready={false} size={cardSize} fontScale={cardSize / 140} />
                ))}
              {preparing.length === 0 && (
                <span style={{ color: "#aaa", fontSize: s(15), marginTop: 8 }}>
                  Nenhum pedido em preparo.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
