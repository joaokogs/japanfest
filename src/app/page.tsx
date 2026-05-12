
"use client";

type Product = {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  orders: number;
  stock: number;
  revenue: number;
};

const mockProducts: Product[] = [
  { id: "P001", name: "Lamen Tonkotsu", category: "Pratos", unitsSold: 320, orders: 180, stock: 210, revenue: 11200 },
  { id: "P002", name: "Temaki Salmao", category: "Sushi", unitsSold: 280, orders: 160, stock: 190, revenue: 9800 },
  { id: "P003", name: "Gyoza Suino", category: "Petiscos", unitsSold: 245, orders: 120, stock: 110, revenue: 6860 },
  { id: "P004", name: "Mochi Matcha", category: "Sobremesas", unitsSold: 172, orders: 96, stock: 150, revenue: 4300 },
  { id: "P005", name: "Cha Gelado Yuzu", category: "Bebidas", unitsSold: 198, orders: 108, stock: 95, revenue: 3564 },
  { id: "P006", name: "Yakitori", category: "Pratos", unitsSold: 214, orders: 114, stock: 86, revenue: 6420 },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");

function getCoverageStatus(stock: number, orders: number) {
  const ratio = stock / Math.max(orders, 1);

  if (ratio < 0.8) {
    return {
      label: "Critico",
      tone: "text-rose-700 bg-rose-50 border-rose-200",
      bar: "bg-rose-500",
    };
  }

  if (ratio < 1.2) {
    return {
      label: "Atencao",
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Saudavel",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
  };
}

export default function Home() {
  const totalRevenue = mockProducts.reduce((acc, item) => acc + item.revenue, 0);
  const totalOrders = mockProducts.reduce((acc, item) => acc + item.orders, 0);
  const totalUnitsSold = mockProducts.reduce((acc, item) => acc + item.unitsSold, 0);
  const totalStock = mockProducts.reduce((acc, item) => acc + item.stock, 0);
  const dailyRevenue = 12450;
  const topProducts = [...mockProducts].sort((a, b) => b.unitsSold - a.unitsSold);
  const maxUnits = Math.max(...topProducts.map((item) => item.unitsSold));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed,transparent_40%),linear-gradient(160deg,#f8fafc_0%,#fdfdfd_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl [font-family:'Sora',Segoe_UI,sans-serif]">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-orange-700">JAPAN FEST - PAINEL DE PERFORMANCE</p>
            <h1 className="text-3xl font-semibold text-zinc-900 md:text-4xl">Dashboard de Vendas e Estoque</h1>
            <p className="mt-2 text-sm text-zinc-500">Dados demonstrativos com foco em vendas, pedidos e estoque.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/85 px-4 py-3 text-right shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Atualizacao</p>
            <p className="text-sm font-semibold text-zinc-800">Agora (mock)</p>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-zinc-500">Total de vendas</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">{brl.format(totalRevenue)}</h2>
            <p className="mt-2 text-xs text-emerald-700">+8,4% vs. semana anterior (mock)</p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-zinc-500">Pedidos</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">{number.format(totalOrders)}</h2>
            <p className="mt-2 text-xs text-zinc-600">{number.format(totalUnitsSold)} itens vendidos</p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm backdrop-blur">
            <p className="text-sm text-zinc-500">Total de vendas do dia</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">{brl.format(dailyRevenue)}</h2>
            <p className="mt-2 text-xs text-emerald-700">+5,1% vs. ontem (mock)</p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Itens mais vendidos</h3>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Top performance</span>
              </div>

              <div className="space-y-4">
                {topProducts.map((item) => {
                  const width = (item.unitsSold / maxUnits) * 100;
                  const share = (item.revenue / totalRevenue) * 100;

                  return (
                    <div key={item.id}>
                      <div className="mb-1 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-medium text-zinc-900">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-900">{number.format(item.unitsSold)} un.</p>
                          <p className="text-xs text-zinc-500">{share.toFixed(1)}% da receita</p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Relacao pedidos x estoque</h3>
                <span className="text-xs uppercase tracking-wider text-zinc-500">Status por item</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-zinc-500">
                      <th className="pb-3 font-medium">Item</th>
                      <th className="pb-3 font-medium">Pedidos</th>
                      <th className="pb-3 font-medium">Estoque</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {mockProducts.map((item) => {
                      const status = getCoverageStatus(item.stock, item.orders);

                      return (
                        <tr key={item.id}>
                          <td className="py-3">
                            <p className="font-medium text-zinc-900">{item.name}</p>
                            <p className="text-xs text-zinc-500">{item.id}</p>
                          </td>
                          <td className="py-3 text-sm text-zinc-700">{number.format(item.orders)}</td>
                          <td className="py-3 text-sm text-zinc-700">{number.format(item.stock)}</td>
                          <td className="py-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${status.tone}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">Resumo rapido</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-700">
                <p>
                  Receita total simulada: <span className="font-semibold text-zinc-900">{brl.format(totalRevenue)}</span>
                </p>
                <p>
                  Produto lider em unidades: <span className="font-semibold text-zinc-900">{topProducts[0]?.name}</span>
                </p>
                <p>
                  Estoque total disponivel: <span className="font-semibold text-zinc-900">{number.format(totalStock)} un.</span>
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-zinc-100 shadow-sm">
              <h3 className="text-lg font-semibold">Meta sugerida</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Manter cobertura acima de <span className="font-semibold text-white">1.20x</span> para reduzir ruptura sem travar capital.
              </p>
              <div className="mt-4 rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-300">Atencao imediata (mock)</p>
                <p className="mt-1 text-sm font-medium text-white">Yakitori e Cha Gelado Yuzu proximos do limite minimo.</p>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
