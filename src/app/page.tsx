"use client";

import { useState } from "react";
import StockTab from "@/components/admin/stock-tab";
import OrderHistoryTab from "@/components/admin/order-history-tab";
import DashboardTab from "@/components/admin/dashboard-tab";
import "./admin/admin.css";

type Tab = "dashboard" | "stock" | "orders";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="admin-root">
      <div className="admin-container">
        <h1 className="admin-title">Administração</h1>
        <p className="admin-subtitle">Gerencie o estoque e acompanhe os pedidos</p>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab${activeTab === "dashboard" ? " active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
            aria-selected={activeTab === "dashboard"}
            role="tab"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Dashboard
          </button>
          <button
            type="button"
            className={`admin-tab${activeTab === "stock" ? " active" : ""}`}
            onClick={() => setActiveTab("stock")}
            aria-selected={activeTab === "stock"}
            role="tab"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M8.25 3.75l2.25 3.75 3-4.5M12 7.5v12m0-12l-3-4.5M12 7.5l3-4.5" />
            </svg>
            Estoque
          </button>
          <button
            type="button"
            className={`admin-tab${activeTab === "orders" ? " active" : ""}`}
            onClick={() => setActiveTab("orders")}
            aria-selected={activeTab === "orders"}
            role="tab"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            Histórico de Pedidos
          </button>
        </div>

        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "stock" && <StockTab />}
        {activeTab === "orders" && <OrderHistoryTab />}
      </div>
    </div>
  );
}
