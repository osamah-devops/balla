import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidBell,
  faSolidBoxOpen,
  faSolidCartShopping,
  faSolidCheck,
  faSolidDollarSign,
  faSolidPlus,
  faSolidStar,
  faSolidStore,
  faSolidTruck,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { StatCard } from '../../components/stat-card/stat-card';
import { AuthService } from '../../services/auth.service';
import { ProductsService } from '../../services/products.service';
import { OrdersService } from '../../services/orders.service';
import { ConversationsService } from '../../services/conversations.service';
import { OffersService } from '../../services/offers.service';
import { NotificationsService } from '../../services/notifications.service';
import { CategoriesService } from '../../services/categories.service';
import { Order, OrderStatus } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { Owner } from '../../models/owner.model';
import { Conversation } from '../../models/conversation.model';
import { Offer } from '../../models/offer.model';

type SellerTab = 'overview' | 'products' | 'orders' | 'activity';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_EXTRA_IMAGES = 6;

@Component({
  selector: 'app-seller-dashboard',
  imports: [NgIcon, StatCard, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.css',
  providers: [
    provideIcons({
      faSolidBell,
      faSolidBoxOpen,
      faSolidCartShopping,
      faSolidCheck,
      faSolidDollarSign,
      faSolidPlus,
      faSolidStar,
      faSolidStore,
      faSolidTruck,
      faSolidXmark,
    }),
  ],
})
export class SellerDashboard {
  private readonly authService = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);
  private readonly conversationsService = inject(ConversationsService);
  private readonly offersService = inject(OffersService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = this.authService.currentUser;
  private readonly ownerId = computed(() => this.currentUser()?.ownerId ?? '');

  readonly tab = signal<SellerTab>('overview');
  readonly categories = this.categoriesService.getCategories();

  private readonly allProducts = toSignal(this.productsService.getProducts(), { initialValue: [] as Product[] });
  private readonly allOwners = toSignal(this.productsService.getOwners(), { initialValue: [] as Owner[] });

  // Products created this session aren't in allProducts() until its cached observable
  // is refetched, so they're tracked separately and merged in for immediate feedback.
  readonly addedProducts = signal<Product[]>([]);
  readonly myProducts = computed<Product[]>(() => {
    const fromServer = this.allProducts().filter((product) => product.owner.id === this.ownerId());
    const added = this.addedProducts().filter((p) => !fromServer.some((f) => f.id === p.id));
    return [...added, ...fromServer];
  });

  readonly myOrders = signal<Order[]>([]);
  readonly orderActionPending = signal<string | null>(null);

  readonly currentOwner = computed<Owner | undefined>(() =>
    this.allOwners().find((owner) => owner.id === this.ownerId()),
  );

  readonly revenue = computed(() =>
    this.myOrders()
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalCents, 0) / 100,
  );

  readonly pendingOrders = computed(() => this.myOrders().filter((order) => order.status === 'paid').length);

  readonly showAddProduct = signal(false);
  readonly addProductSubmitting = signal(false);
  readonly addProductError = signal('');
  readonly productImagePreview = signal<string | null>(null);
  private productImageFile: File | null = null;

  readonly extraImagePreviews = signal<string[]>([]);
  private extraImageFiles: File[] = [];
  readonly optionRows = signal<{ name: string; values: string }[]>([]);

  readonly productForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    categorySlug: ['', [Validators.required]],
    price: ['', [Validators.required]],
    currency: ['USD', [Validators.required]],
    fullDescription: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly recentConversations = signal<Conversation[]>([]);
  readonly offers = signal<Offer[]>([]);
  readonly offerActionPending = signal<string | null>(null);

  constructor() {
    this.loadInboxes();

    // Keep the inboxes in sync whenever a live event comes in.
    effect(() => {
      if (this.notifications().length > 0) {
        this.loadInboxes();
      }
    });
  }

  setTab(tab: SellerTab): void {
    this.tab.set(tab);
    if (tab === 'activity') {
      this.notificationsService.markAllRead();
    }
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'shipped':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400';
      case 'paid':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
    }
  }

  updateOrderStatus(order: Order, status: 'shipped' | 'delivered' | 'cancelled'): void {
    this.orderActionPending.set(order.id);
    this.ordersService.updateStatus(order.id, { status }).subscribe({
      next: (updated) => {
        this.myOrders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.orderActionPending.set(null);
      },
      error: () => this.orderActionPending.set(null),
    });
  }

  onProductImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.addProductError.set('Product photo must be an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.addProductError.set('Product photo must be smaller than 5MB.');
      return;
    }
    this.addProductError.set('');
    this.productImageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.productImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onExtraImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    if (this.extraImageFiles.length + files.length > MAX_EXTRA_IMAGES) {
      this.addProductError.set(`Add at most ${MAX_EXTRA_IMAGES} extra photos.`);
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.addProductError.set('Extra photos must be image files.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        this.addProductError.set('Each extra photo must be smaller than 5MB.');
        return;
      }
    }
    this.addProductError.set('');
    this.extraImageFiles = [...this.extraImageFiles, ...files];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => this.extraImagePreviews.update((previews) => [...previews, reader.result as string]);
      reader.readAsDataURL(file);
    }
  }

  removeExtraImage(index: number): void {
    this.extraImageFiles = this.extraImageFiles.filter((_, i) => i !== index);
    this.extraImagePreviews.update((previews) => previews.filter((_, i) => i !== index));
  }

  addOptionRow(): void {
    this.optionRows.update((rows) => [...rows, { name: '', values: '' }]);
  }

  updateOptionRow(index: number, field: 'name' | 'values', value: string): void {
    this.optionRows.update((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  removeOptionRow(index: number): void {
    this.optionRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  submitProduct(): void {
    if (this.productForm.invalid || !this.productImageFile) {
      this.productForm.markAllAsTouched();
      if (!this.productImageFile) {
        this.addProductError.set('A product photo is required.');
      }
      return;
    }

    const { title, categorySlug, price, currency, fullDescription } = this.productForm.getRawValue();
    const category = this.categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug;
    const options = this.optionRows()
      .map((row) => ({ name: row.name.trim(), values: row.values.split(',').map((v) => v.trim()).filter((v) => v.length > 0) }))
      .filter((option) => option.name.length > 0 && option.values.length > 0);

    this.addProductSubmitting.set(true);
    this.addProductError.set('');
    this.productsService
      .createProduct({
        title,
        category,
        categorySlug,
        price,
        currency,
        fullDescription,
        image: this.productImageFile,
        extraImages: this.extraImageFiles,
        options,
      })
      .subscribe({
        next: (product) => {
          this.addedProducts.update((list) => [product, ...list]);
          this.addProductSubmitting.set(false);
          this.showAddProduct.set(false);
          this.productForm.reset({ title: '', categorySlug: '', price: '', currency: 'USD', fullDescription: '' });
          this.productImageFile = null;
          this.productImagePreview.set(null);
          this.extraImageFiles = [];
          this.extraImagePreviews.set([]);
          this.optionRows.set([]);
        },
        error: (err) => {
          this.addProductSubmitting.set(false);
          this.addProductError.set((err as { error?: { message?: string } })?.error?.message || 'Could not add this product.');
        },
      });
  }

  respondToOffer(offer: Offer, status: 'accepted' | 'rejected'): void {
    this.offerActionPending.set(offer.id);
    this.offersService.updateStatus(offer.id, status).subscribe({
      next: (updated) => {
        this.offers.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.offerActionPending.set(null);
      },
      error: () => this.offerActionPending.set(null),
    });
  }

  private loadInboxes(): void {
    this.conversationsService.listConversations().subscribe((conversations) => this.recentConversations.set(conversations.slice(0, 5)));
    this.offersService.getInbox().subscribe((offers) => this.offers.set(offers));
    this.ordersService.getSellingOrders().subscribe((orders) => this.myOrders.set(orders));
  }
}
