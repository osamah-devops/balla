export type AppNotificationType = 'comment' | 'rating' | 'message' | 'offer';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  conversationId?: string;
  productId?: string;
  productTitle?: string;
  message: string;
  createdAt: string;
  read: boolean;
}
