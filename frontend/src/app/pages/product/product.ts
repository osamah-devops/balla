import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidCartPlus,
  faSolidChevronLeft,
  faSolidChevronRight,
  faSolidCommentDots,
  faSolidEnvelope,
  faSolidHandHoldingDollar,
  faSolidMagnifyingGlassPlus,
  faSolidStar,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { Product as ProductModel } from '../../models/product.model';
import { Comment } from '../../models/comment.model';
import { ProductsService } from '../../services/products.service';
import { ConversationsService } from '../../services/conversations.service';
import { OffersService } from '../../services/offers.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product',
  imports: [RouterLink, ReactiveFormsModule, NgIcon, DecimalPipe],
  templateUrl: './product.html',
  styleUrl: './product.css',
  providers: [
    provideIcons({
      faSolidCartPlus,
      faSolidChevronLeft,
      faSolidChevronRight,
      faSolidCommentDots,
      faSolidEnvelope,
      faSolidHandHoldingDollar,
      faSolidMagnifyingGlassPlus,
      faSolidStar,
      faSolidXmark,
    }),
  ],
})
export class Product {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly conversationsService = inject(ConversationsService);
  private readonly offersService = inject(OffersService);
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly fb = inject(FormBuilder);

  // Angular's default RouteReuseStrategy reuses this component across /product/:id ->
  // /product/:other-id navigations (same routeConfig), so route data must be read
  // reactively rather than once from the snapshot, or a direct product-to-product
  // link would keep showing the previous product.
  private readonly routeData = toSignal(this.route.data, { requireSync: true });
  product = computed(() => this.routeData()['product'] as ProductModel);
  specEntries = computed(() => Object.entries(this.product().specifications ?? {}));

  private readonly ratingOverride = signal<{ averageRating: number; ratingCount: number } | null>(null);
  readonly displayProduct = computed(() => {
    const base = this.product();
    const override = this.ratingOverride();
    return override ? { ...base, ...override } : base;
  });

  readonly galleryImages = computed(() => [this.product().image, ...(this.product().extraImages ?? [])]);
  readonly activeImage = signal<string | null>(null);
  readonly displayImage = computed(() => this.activeImage() ?? this.displayProduct().image);
  readonly imageIndex = computed(() => Math.max(0, this.galleryImages().indexOf(this.displayImage())));
  readonly lightboxOpen = signal(false);
  readonly selectedOptions = signal<Record<string, string>>({});

  owner = toSignal(
    toObservable(this.product).pipe(switchMap((product) => this.productsService.getOwnerById(product.owner.id))),
  );

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly stars = [1, 2, 3, 4, 5];
  readonly hoverStars = signal(0);
  readonly ratingSubmitting = signal(false);

  readonly comments = signal<Comment[]>([]);
  readonly commentForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
  });
  readonly commentSubmitting = signal(false);

  readonly messageOpen = signal(false);
  readonly messageForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });
  readonly messageSubmitting = signal(false);
  readonly messageSent = signal(false);
  readonly sentConversationId = signal<string | null>(null);

  readonly offerOpen = signal(false);
  readonly offerForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    note: [''],
  });
  readonly offerSubmitting = signal(false);
  readonly offerSent = signal(false);

  readonly addedToCart = signal(false);

  constructor() {
    toObservable(this.product)
      .pipe(
        tap(() => {
          this.ratingOverride.set(null);
          this.messageOpen.set(false);
          this.messageSent.set(false);
          this.sentConversationId.set(null);
          this.offerOpen.set(false);
          this.offerSent.set(false);
          this.activeImage.set(null);
          this.lightboxOpen.set(false);
          this.selectedOptions.set({});
          this.addedToCart.set(false);
        }),
        switchMap((product) => this.productsService.getComments(product.id)),
      )
      .subscribe((comments) => this.comments.set(comments));
  }

  setActiveImage(url: string): void {
    this.activeImage.set(url);
  }

  nextImage(): void {
    const images = this.galleryImages();
    this.activeImage.set(images[(this.imageIndex() + 1) % images.length]);
  }

  prevImage(): void {
    const images = this.galleryImages();
    this.activeImage.set(images[(this.imageIndex() - 1 + images.length) % images.length]);
  }

  openLightbox(): void {
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  selectOption(name: string, value: string): void {
    this.selectedOptions.update((selected) => ({ ...selected, [name]: value }));
  }

  addToCart(): void {
    const product = this.product();
    this.cartService.add({
      productId: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      sellerId: product.owner.id,
      sellerName: product.owner.name,
      selectedOptions: Object.keys(this.selectedOptions()).length > 0 ? this.selectedOptions() : undefined,
    });
    this.addedToCart.set(true);
  }

  rate(stars: number): void {
    if (!this.isAuthenticated() || this.ratingSubmitting()) {
      return;
    }
    this.ratingSubmitting.set(true);
    this.productsService.rateProduct(this.product().id, stars).subscribe({
      next: (updated) => {
        this.ratingOverride.set({ averageRating: updated.averageRating, ratingCount: updated.ratingCount });
        this.ratingSubmitting.set(false);
      },
      error: () => this.ratingSubmitting.set(false),
    });
  }

  submitComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    this.commentSubmitting.set(true);
    this.productsService.addComment(this.product().id, this.commentForm.getRawValue().body).subscribe({
      next: (comment) => {
        this.comments.update((list) => [comment, ...list]);
        this.commentForm.reset({ body: '' });
        this.commentSubmitting.set(false);
      },
      error: () => this.commentSubmitting.set(false),
    });
  }

  /** Prefixes buyer-selected variants (e.g. "Size: M, Color: Blue") so the seller has context
   * on a message/offer, which — unlike a cart checkout — has no structured place for them. */
  private withSelectedOptions(text: string): string {
    const entries = Object.entries(this.selectedOptions());
    if (entries.length === 0) {
      return text;
    }
    const summary = entries.map(([name, value]) => `${name}: ${value}`).join(', ');
    return text ? `[${summary}] ${text}` : `[${summary}]`;
  }

  submitMessage(): void {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }
    this.messageSubmitting.set(true);
    const body = this.withSelectedOptions(this.messageForm.getRawValue().body);
    this.conversationsService
      .startConversation(this.product().owner.id, { productId: this.product().id, body })
      .subscribe({
        next: (conversation) => {
          this.messageSubmitting.set(false);
          this.messageSent.set(true);
          this.sentConversationId.set(conversation.id);
          this.messageForm.reset({ body: '' });
        },
        error: () => this.messageSubmitting.set(false),
      });
  }

  submitOffer(): void {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }
    this.offerSubmitting.set(true);
    const { amount, note } = this.offerForm.getRawValue();
    this.offersService
      .sendOffer(this.product().owner.id, { productId: this.product().id, amount, note: this.withSelectedOptions(note) || undefined })
      .subscribe({
        next: () => {
          this.offerSubmitting.set(false);
          this.offerSent.set(true);
          this.offerForm.reset({ amount: 0, note: '' });
        },
        error: () => this.offerSubmitting.set(false),
      });
  }
}
