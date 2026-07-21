import { Component, computed, signal, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidBan,
  faSolidBoxOpen,
  faSolidCheck,
  faSolidDollarSign,
  faSolidEyeSlash,
  faSolidFlag,
  faSolidPeopleGroup,
  faSolidStore,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { StatCard } from '../../components/stat-card/stat-card';
import { AdminService } from '../../services/admin.service';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../models/product.model';
import { Owner } from '../../models/owner.model';
import { Order } from '../../models/order.model';
import { Report } from '../../models/report.model';
import { User, UserStatus } from '../../models/user.model';

type AdminTab = 'overview' | 'users' | 'sellers' | 'products' | 'reports';

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
      faSolidFlag,
      faSolidPeopleGroup,
      faSolidStore,
      faSolidUsers,
    }),
  ],
})
export class AdminDashboard {
  private readonly adminService = inject(AdminService);
  private readonly productsService = inject(ProductsService);

  readonly tab = signal<AdminTab>('overview');

  readonly users = signal<User[]>([]);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly reports = signal<Report[]>([]);
  private readonly owners = signal<Owner[]>([]);

  constructor() {
    this.adminService.listUsers().subscribe((users) => this.users.set(users));
    this.adminService.listProducts().subscribe((products) => this.products.set(products));
    this.adminService.listOrders().subscribe((orders) => this.orders.set(orders));
    this.adminService.listReports().subscribe((reports) => this.reports.set(reports));
    this.productsService.getOwners().subscribe((owners) => this.owners.set(owners));
  }

  readonly totalAdmins = computed(() => this.users().filter((user) => user.role === 'admin').length);
  readonly totalSellers = computed(() => this.users().filter((user) => user.role === 'seller').length);
  readonly totalCustomers = computed(() => this.users().filter((user) => user.role === 'customer').length);
  readonly suspendedUsers = computed(() => this.users().filter((user) => user.status === 'suspended').length);
  readonly pendingOrders = computed(() => this.orders().filter((order) => order.status === 'paid').length);
  readonly totalRevenue = computed(
    () =>
      this.orders()
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.totalCents, 0) / 100,
  );

  readonly sellerRows = computed<SellerRow[]>(() =>
    this.owners().map((owner) => ({
      ...owner,
      productCount: this.products().filter((product) => product.owner.id === owner.id).length,
      revenue:
        this.orders()
          .filter((order) => order.sellerId === owner.id && order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.totalCents, 0) / 100,
    })),
  );

  setTab(tab: AdminTab): void {
    this.tab.set(tab);
  }

  toggleUserStatus(user: User): void {
    const next: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    this.adminService.updateUserStatus(user.id, next).subscribe((updated) => {
      this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    });
  }

  toggleProductVisibility(productId: string): void {
    const product = this.products().find((p) => p.id === productId);
    if (!product) {
      return;
    }
    this.adminService.updateProductVisibility(productId, !product.hidden).subscribe((updated) => {
      this.products.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    });
  }

  isProductHidden(productId: string): boolean {
    return this.products().find((p) => p.id === productId)?.hidden ?? false;
  }

  suspendReportedUser(report: Report): void {
    this.adminService.updateUserStatus(report.reportedUserId, 'suspended').subscribe((updated) => {
      this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    });
  }

  toggleSellerVerification(seller: Owner): void {
    this.adminService.updateOwnerVerification(seller.id, !seller.verified).subscribe((updated) => {
      this.owners.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    });
  }
}
