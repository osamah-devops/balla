import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidCartShopping, faSolidMinus, faSolidPlus, faSolidTrash } from '@ng-icons/font-awesome/solid';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart',
  imports: [DecimalPipe, KeyValuePipe, RouterLink, NgIcon],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  providers: [provideIcons({ faSolidCartShopping, faSolidMinus, faSolidPlus, faSolidTrash })],
})
export class Cart {
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly authService = inject(AuthService);

  readonly items = this.cartService.items;
  readonly subtotal = computed(() => this.cartService.subtotalCents() / 100);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly checkingOut = signal(false);
  readonly errorMessage = signal('');

  lineTotal(price: string, quantity: number): number {
    const cleaned = price.replace(/[^0-9.]/g, '');
    return (parseFloat(cleaned || '0') || 0) * quantity;
  }

  increment(productId: string, selectedOptions: Record<string, string> | undefined, quantity: number): void {
    this.cartService.updateQuantity(productId, selectedOptions, quantity + 1);
  }

  decrement(productId: string, selectedOptions: Record<string, string> | undefined, quantity: number): void {
    this.cartService.updateQuantity(productId, selectedOptions, quantity - 1);
  }

  remove(productId: string, selectedOptions?: Record<string, string>): void {
    this.cartService.remove(productId, selectedOptions);
  }

  checkout(): void {
    if (this.items().length === 0) {
      return;
    }
    this.checkingOut.set(true);
    this.errorMessage.set('');
    const items = this.items().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
    }));
    this.checkoutService.createSession({ items }).subscribe({
      next: (session) => {
        window.location.href = session.url;
      },
      error: (err) => {
        this.checkingOut.set(false);
        this.errorMessage.set((err as { error?: { message?: string } })?.error?.message || 'Could not start checkout. Please try again.');
      },
    });
  }
}
