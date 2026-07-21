import { Component, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidBoxOpen, faSolidTruck } from '@ng-icons/font-awesome/solid';
import { OrdersService } from '../../services/orders.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-my-orders',
  imports: [DecimalPipe, DatePipe, NgIcon],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
  providers: [provideIcons({ faSolidBoxOpen, faSolidTruck })],
})
export class MyOrders {
  private readonly ordersService = inject(OrdersService);

  readonly orders = signal<Order[]>([]);

  constructor() {
    this.ordersService.getMyOrders().subscribe((orders) => this.orders.set(orders));
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
}
