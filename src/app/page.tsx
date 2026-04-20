
import { OrdersCard, mockOrders } from "../components/ordersCard";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-black dark:text-zinc-50">Pedidos em Curso</h1>
      <div className="flex flex-wrap gap-6 justify-center w-full">
        {mockOrders.map((order) => (
          <OrdersCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
