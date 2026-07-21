import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidCartShopping } from '@ng-icons/font-awesome/solid';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-cart-link',
  standalone: true,
  imports: [RouterLink, NgIcon],
  templateUrl: './cart-link.html',
  styleUrl: './cart-link.css',
  providers: [provideIcons({ faSolidCartShopping })],
})
export class CartLink {
  private readonly cartService = inject(CartService);
  readonly itemCount = this.cartService.itemCount;
}
