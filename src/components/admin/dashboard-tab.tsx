"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOrdersWithItems, fetchProducts, buildMergedOrders } from "@/lib/api";
import type { MergedOrder } from "@/lib/types";
import "@/app/admin/admin.css";

interface ProdCount {
  name: string;
  quantity: number;
}

interface DayRevenue {
  date: string;
  revenue: number;
}

const PIE_COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#2980b9",
  "#c0392b", "#16a085", "#8e44ad", "#d35400",
  "#27ae60", "#f1c40f", "#2c3e50", "#e91e63",
];

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return dateStr;
  }
}

function aggregateProducts(orders: MergedOrder[]): ProdCount[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      map.set(item.name, (map.get(item.name) ?? 0) + item.quantity);
    }
  }
  return Array.from(map.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
}

function calcRevenue(orders: MergedOrder[], prices: Map<string, number>): number {
  let total = 0;
  for (const o of orders) {
    for (const item of o.items) {
      total += (prices.get(item.name) ?? 0) * item.quantity;
    }
  }
  return total;
}

function todayStr(): string {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function calcRevenueByDay(orders: MergedOrder[], prices: Map<string, number>): DayRevenue[] {
  // Check if API provides dates
  const hasDates = orders.some((o) => o.date);
  if (!hasDates) {
    // Fallback: group all orders under today's date (festival assumption)
    const today = todayStr();
    let total = 0;
    for (const o of orders) {
      for (const item of o.items) {
        total += (prices.get(item.name) ?? 0) * item.quantity;
      }
    }
    return [{ date: today, revenue: total }];
  }

  const map = new Map<string, number>();
  for (const o of orders) {
    if (!o.date) continue;
    const day = formatDateShort(o.date);
    let rev = 0;
    for (const item of o.items) {
      rev += (prices.get(item.name) ?? 0) * item.quantity;
    }
    map.set(day, (map.get(day) ?? 0) + rev);
  }
  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => {
      const [da, ma] = a.date.split("/").map(Number);
      const [db, mb] = b.date.split("/").map(Number);
      return ma - mb || da - db;
    });
}

function groupDay(orders: MergedOrder[]): MergedOrder[] {
  const hasDates = orders.some((o) => o.date);
  if (!hasDates) return orders; // All orders are from today (festival context)
  return orders.filter((o) => isToday(o.date));
}

function buildPieConfig(data: ProdCount[]): ChartConfig {
  const config: ChartConfig = {};
  data.forEach((item, idx) => {
    config[item.name] = {
      label: item.name,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    };
  });
  return config;
}

export default function DashboardTab() {
  const [orders, setOrders] = useState<MergedOrder[]>([]);
  const [productPrices, setProductPrices] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawOrders, products] = await Promise.all([
        fetchOrdersWithItems(),
        fetchProducts(),
      ]);
      const merged = await buildMergedOrders(rawOrders);
      const completed = merged.filter(
        (o) => o.status.toLowerCase() === "entregue" || o.status.toLowerCase() === "pronto",
      );
      setOrders(completed);
      setProductPrices(new Map(products.map((p) => [p.name, p.price])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const geralProducts = useMemo(() => aggregateProducts(orders), [orders]);
  const dayOrders = useMemo(() => groupDay(orders), [orders]);
  const dayProducts = useMemo(() => aggregateProducts(dayOrders), [dayOrders]);

  const revenueGeral = useMemo(() => calcRevenue(orders, productPrices), [orders, productPrices]);
  const revenueDay = useMemo(() => calcRevenue(dayOrders, productPrices), [dayOrders, productPrices]);
  const revenueByDay = useMemo(() => calcRevenueByDay(orders, productPrices), [orders, productPrices]);

  const pieConfigGeral = useMemo(() => buildPieConfig(geralProducts), [geralProducts]);
  const pieConfigDay = useMemo(() => buildPieConfig(dayProducts), [dayProducts]);

  const barRevenueConfig: ChartConfig = {
    revenue: { label: "Arrecadado", color: "#f08918" },
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
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

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Arrecadado (Geral)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {formatCurrency(revenueGeral)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""} concluído{orders.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Arrecadado (Hoje)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(revenueDay)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dayOrders.length} pedido{dayOrders.length !== 1 ? "s" : ""} hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Products General */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos Mais Vendidos (Geral)</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição de vendas por produto</p>
          </CardHeader>
          <CardContent>
            {geralProducts.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Nenhum produto vendido ainda.
              </div>
            ) : (
              <ChartContainer config={pieConfigGeral} className="mx-auto h-[300px] w-full max-w-[400px]">
                <PieChart>
                  <Pie
                    data={geralProducts}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {geralProducts.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} unidade(s)`} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Products Today */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos Mais Vendidos (Hoje)</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição de vendas do dia</p>
          </CardHeader>
          <CardContent>
            {dayProducts.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                Nenhuma venda hoje.
              </div>
            ) : (
              <ChartContainer config={pieConfigDay} className="mx-auto h-[300px] w-full max-w-[400px]">
                <PieChart>
                  <Pie
                    data={dayProducts}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {dayProducts.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} unidade(s)`} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue per Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Arrecadado por Dia</CardTitle>
          <p className="text-xs text-muted-foreground">Faturamento dos pedidos concluídos</p>
        </CardHeader>
        <CardContent>
          {revenueByDay.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Nenhum dado disponível.
            </div>
          ) : (
            <ChartContainer config={barRevenueConfig} className="h-[300px] w-full">
              <BarChart data={revenueByDay} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => `R$ ${Number(value).toFixed(2).replace(".", ",")}`} />}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[6, 6, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
