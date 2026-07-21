export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  quantity: number;
  total: number;
  currency: string;
  status: OrderStatus;
  date: string;
}