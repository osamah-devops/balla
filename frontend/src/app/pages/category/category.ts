import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Category as CategoryModel } from '../../models/category.model';
import { Product } from '../../models/product.model';
import { ProductCard } from '../../components/product-card/product-card';
import { ResponsivePageSizeService } from '../../services/responsive-page-size.service';

@Component({
  selector: 'app-category',
  imports: [MatPaginatorModule, ProductCard],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly responsivePageSize = inject(ResponsivePageSizeService);

  // Angular's default RouteReuseStrategy reuses this component across /category/:id ->
  // /category/:other-id navigations (same routeConfig), so route data must be read
  // reactively rather than once from the snapshot, or a direct category-to-category
  // link would keep showing the previous category's products.
  private readonly routeData = toSignal(this.route.data, { requireSync: true });
  category = computed(() => this.routeData()['category'] as CategoryModel);
  products = computed(() => (this.routeData()['products'] as Product[]) ?? []);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  pageSizeOptions = this.responsivePageSize.pageSizeOptions;
  pageSize = computed(
    () => Number(this.queryParamMap().get('pageSize')) || this.responsivePageSize.defaultPageSize(),
  );
  pageIndex = computed(() => Number(this.queryParamMap().get('page')) || 0);

  pagedProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.products().slice(start, start + this.pageSize());
  });

  onPageChange(event: PageEvent): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: event.pageIndex || null,
        pageSize: event.pageSize === this.responsivePageSize.defaultPageSize() ? null : event.pageSize,
      },
      queryParamsHandling: 'merge',
    });
  }
}
