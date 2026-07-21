export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerProfileImageUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerProfileImageUrl?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastProductId?: string;
  lastProductTitle?: string;
  unreadCount: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  productId?: string;
  productTitle?: string;
  createdAt: string;
}

export interface StartConversationRequest {
  productId?: string;
  body: string;
}

export interface SendReplyRequest {
  body: string;
}
