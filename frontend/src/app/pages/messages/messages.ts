import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidArrowLeft, faSolidComments, faSolidPaperPlane, faSolidUser } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../services/auth.service';
import { ConversationsService } from '../../services/conversations.service';
import { Conversation, ConversationMessage } from '../../models/conversation.model';

@Component({
  selector: 'app-messages',
  imports: [ReactiveFormsModule, NgIcon, NgTemplateOutlet],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
  providers: [provideIcons({ faSolidArrowLeft, faSolidComments, faSolidPaperPlane, faSolidUser })],
})
export class Messages {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly conversationsService = inject(ConversationsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? '');

  readonly conversations = signal<Conversation[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly selectedMessages = signal<ConversationMessage[]>([]);
  readonly loadingMessages = signal(false);
  readonly sending = signal(false);

  readonly selectedConversation = computed(
    () => this.conversations().find((c) => c.id === this.selectedId()) ?? null,
  );

  readonly replyForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    this.loadConversations();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const conversationId = params.get('conversation');
      if (conversationId) {
        this.select(conversationId);
      }
    });
  }

  otherPartyName(conversation: Conversation): string {
    return conversation.buyerId === this.currentUserId() ? conversation.sellerName : conversation.buyerName;
  }

  /** Fixed convention regardless of viewer: the buyer's bubbles/avatar sit on the right, the seller's on the left. */
  isBuyerMessage(message: ConversationMessage, conversation: Conversation): boolean {
    return message.senderId === conversation.buyerId;
  }

  avatarFor(message: ConversationMessage, conversation: Conversation): string | undefined {
    return this.isBuyerMessage(message, conversation) ? conversation.buyerProfileImageUrl : conversation.sellerProfileImageUrl;
  }

  backToList(): void {
    this.selectedId.set(null);
  }

  select(conversationId: string): void {
    if (this.selectedId() === conversationId) {
      return;
    }
    this.selectedId.set(conversationId);
    this.loadingMessages.set(true);
    this.conversationsService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.selectedMessages.set(messages);
        this.loadingMessages.set(false);
        this.conversations.update((list) =>
          list.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
        );
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  sendReply(): void {
    const conversationId = this.selectedId();
    if (!conversationId || this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    const { body } = this.replyForm.getRawValue();
    this.conversationsService.sendReply(conversationId, { body }).subscribe({
      next: (message) => {
        this.selectedMessages.update((list) => [...list, message]);
        this.replyForm.reset({ body: '' });
        this.sending.set(false);
      },
      error: () => this.sending.set(false),
    });
  }

  private loadConversations(): void {
    this.conversationsService.listConversations().subscribe((conversations) => this.conversations.set(conversations));
  }
}
