export interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
}

export interface CheckoutSessionResponse {
  url: string;
}
