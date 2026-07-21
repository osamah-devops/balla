export type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  unitPriceCents: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  totalCents: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusRequest {
  status: Extract<OrderStatus, 'shipped' | 'delivered' | 'cancelled'>;
}
