import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidCircleCheck } from '@ng-icons/font-awesome/solid';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-checkout-success',
  imports: [RouterLink, NgIcon],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.css',
  providers: [provideIcons({ faSolidCircleCheck })],
})
export class CheckoutSuccess {
  constructor() {
    // The order itself is confirmed server-side by the Stripe webhook; clearing the
    // cart here is just tidying up the client now that payment has been collected.
    inject(CartService).clear();
  }
}
