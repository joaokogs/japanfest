"use client";

import { useState } from "react";
import { OrdersCard } from "@/components/ordersCard";

interface OrderItem {
    name: string;
	quantity: number;
	note?: string;
}

interface Order {
    id: number;
	table?: string;
	prioridade?: boolean;
	status: "EM PREPARO";
	items: OrderItem[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([
        {
            id: 402,           
            status: "EM PREPARO",
            prioridade: true,
            items: [
                { name: "Wagyu Tartare", quantity: 2 },
                { name: "Risoto de Trufas", quantity: 1 },
            ],
        },
        {
            id: 405,
            status: "EM PREPARO",
            prioridade: true,
            items: [
                { name: "Vieiras Grelhadas", quantity: 4 },
                { name: "Confit de Pato", quantity: 1 },
            ],
        },
    ]);

    const handleFinish = (id: number) => {
        setOrders((prev) => prev.filter((order) => order.id !== id));
    };

    const handleCancel = (id: number) => {
        setOrders((prev) => prev.filter((order) => order.id !== id));
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">
                Pedidos em Curso
            </h1>

            <div className="flex flex-wrap gap-6">
                {orders.map((order) => (
                    <OrdersCard
                        key={order.id}
                        order={order}
                        onFinish={() => handleFinish(order.id)}
                        onCancel={() => handleCancel(order.id)}
                    />
                ))}
            </div>
        </div>
    );
}