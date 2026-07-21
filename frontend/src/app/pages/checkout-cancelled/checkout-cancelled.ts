import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidCircleXmark } from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-checkout-cancelled',
  imports: [RouterLink, NgIcon],
  templateUrl: './checkout-cancelled.html',
  styleUrl: './checkout-cancelled.css',
  providers: [provideIcons({ faSolidCircleXmark })],
})
export class CheckoutCancelled {}
