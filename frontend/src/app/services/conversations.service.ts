import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Conversation,
  ConversationMessage,
  SendReplyRequest,
  StartConversationRequest,
} from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private readonly http = inject(HttpClient);

  startConversation(sellerId: string, request: StartConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`/api/sellers/${sellerId}/conversations`, request);
  }

  listConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>('/api/conversations');
  }

  getMessages(conversationId: string): Observable<ConversationMessage[]> {
    return this.http.get<ConversationMessage[]>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
  }

  sendReply(conversationId: string, request: SendReplyRequest): Observable<ConversationMessage> {
    return this.http.post<ConversationMessage>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      request,
    );
  }

  report(conversationId: string, reason: string): Observable<void> {
    return this.http.post<void>(`/api/conversations/${encodeURIComponent(conversationId)}/report`, {
      reason,
    });
  }
}
