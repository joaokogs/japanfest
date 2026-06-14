export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  priority?: boolean;
  customizable?: boolean;
}

export interface StockEntry {
  product_id: number;
  quantity: number;
}

export interface OrderProduct {
  product_id: number;
  name: string;
  quantity: number;
  note?: string;
  customizations?: string[] | null;
}

export interface Order {
  id: number;
  priority: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
  products?: OrderProduct[];
  items?: OrderProduct[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  note?: string;
  image?: string;
  customizations?: { id: number; description: string }[];
}

export interface MergedOrder {
  id: number;
  priority: boolean;
  status: string;
  items: OrderItem[];
  date: string;
}
