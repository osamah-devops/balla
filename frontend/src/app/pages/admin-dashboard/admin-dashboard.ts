import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidBan,
  faSolidBoxOpen,
  faSolidCheck,
  faSolidDollarSign,
  faSolidEyeSlash,
  faSolidPeopleGroup,
  faSolidStore,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { StatCard } from '../../components/stat-card/stat-card';
import { UsersService } from '../../services/users.service';
import { ProductsService } from '../../services/products.service';
import { OrdersService } from '../../services/orders.service';
import { Product } from '../../models/product.model';
import { Owner } from '../../models/owner.model';
import { Order } from '../../models/order.model';
import { User, UserStatus } from '../../models/user.model';

type AdminTab = 'overview' | 'users' | 'sellers' | 'products';

interface SellerRow extends Owner {
  productCount: number;
  revenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [NgIcon, StatCard, DecimalPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  providers: [
    provideIcons({
      faSolidBan,
      faSolidBoxOpen,
      faSolidCheck,
      faSolidDollarSign,
      faSolidEyeSlash,
      faSolidPeopleGroup,
      faSolidStore,
      faSolidUsers,
    }),
  ],
})
export class AdminDashboard {
  private readonly usersService = inject(UsersService);
  private readonly productsService = inject(ProductsService);
  private readonly ordersService = inject(OrdersService);

  readonly tab = signal<AdminTab>('overview');

  // Triggers the load; the users table itself reads usersService.users so
  // that admin actions (suspend/activate) update the view reactively.
  private readonly usersLoaded = toSignal(this.usersService.getUsers(), { initialValue: [] as User[] });
  readonly users = this.usersService.users;

  readonly products = toSignal(this.productsService.getProducts(), { initialValue: [] as Product[] });
  private readonly owners = toSignal(this.productsService.getOwners(), { initialValue: [] as Owner[] });
  private readonly orders = toSignal(this.ordersService.getOrders(), { initialValue: [] as Order[] });

  readonly hiddenProductIds = signal<Set<string>>(new Set());

  readonly totalAdmins = computed(() => this.users().filter((user) => user.role === 'admin').length);
  readonly totalSellers = computed(() => this.users().filter((user) => user.role === 'seller').length);
  readonly totalCustomers = computed(() => this.users().filter((user) => user.role === 'customer').length);
  readonly suspendedUsers = computed(() => this.users().filter((user) => user.status === 'suspended').length);
  readonly pendingOrders = computed(() => this.orders().filter((order) => order.status === 'pending').length);
  readonly totalRevenue = computed(() =>
    this.orders()
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0),
  );

  readonly sellerRows = computed<SellerRow[]>(() =>
    this.owners().map((owner) => ({
      ...owner,
      productCount: this.products().filter((product) => product.owner.id === owner.id).length,
      revenue: this.orders()
        .filter((order) => order.sellerId === owner.id && order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0),
    })),
  );

  setTab(tab: AdminTab): void {
    this.tab.set(tab);
  }

  toggleUserStatus(user: User): void {
    const next: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    this.usersService.setStatus(user.id, next);
  }

  toggleProductVisibility(productId: string): void {
    this.hiddenProductIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  isProductHidden(productId: string): boolean {
    return this.hiddenProductIds().has(productId);
  }
}
