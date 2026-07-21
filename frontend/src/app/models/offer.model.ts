export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Offer {
  id: string;
  sellerId: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  note?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface CreateOfferRequest {
  productId: string;
  amount: number;
  note?: string;
}
