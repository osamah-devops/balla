import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart.model';

const STORAGE_KEY = 'balla.cart';

/**
 * Cart lives client-side (localStorage) until checkout — there's no server-side cart
 * table, since it's ephemeral pre-purchase state. Checkout sends the current items to
 * the backend, which is the only place prices/availability get re-validated.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.load());
  readonly itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotalCents = computed(() =>
    this.items().reduce((sum, item) => sum + this.priceToCents(item.price) * item.quantity, 0),
  );

  add(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
    this.items.update((list) => {
      const key = this.lineKey(item.productId, item.selectedOptions);
      const existing = list.find((i) => this.lineKey(i.productId, i.selectedOptions) === key);
      const next = existing
        ? list.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
        : [...list, { ...item, quantity }];
      this.persist(next);
      return next;
    });
  }

  updateQuantity(productId: string, selectedOptions: Record<string, string> | undefined, quantity: number): void {
    this.items.update((list) => {
      const key = this.lineKey(productId, selectedOptions);
      const next =
        quantity <= 0
          ? list.filter((i) => this.lineKey(i.productId, i.selectedOptions) !== key)
          : list.map((i) => (this.lineKey(i.productId, i.selectedOptions) === key ? { ...i, quantity } : i));
      this.persist(next);
      return next;
    });
  }

  remove(productId: string, selectedOptions?: Record<string, string>): void {
    this.updateQuantity(productId, selectedOptions, 0);
  }

  clear(): void {
    this.items.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  private lineKey(productId: string, selectedOptions?: Record<string, string>): string {
    return `${productId}::${JSON.stringify(selectedOptions ?? {})}`;
  }

  private priceToCents(price: string): number {
    const cleaned = price.replace(/[^0-9.]/g, '');
    return Math.round(parseFloat(cleaned || '0') * 100);
  }

  private persist(items: CartItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
