import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidSliders, faSolidXmark } from '@ng-icons/font-awesome/solid';
import { ProductCard } from '../../components/product-card/product-card';
import { FiltersPanel } from '../../components/filters-panel/filters-panel';
import { CategoriesService } from '../../services/categories.service';
import { ProductFilterService } from '../../services/product-filter.service';
import { ResponsivePageSizeService } from '../../services/responsive-page-size.service';
import { Product } from '../../models/product.model';
import { SortKey } from '../../models/product-filter-criteria.model';
import { US_STATES } from '../../data/us-states';
import { PRICE_RANGES, SORT_OPTIONS } from '../../data/product-filter-options';

@Component({
  selector: 'app-products',
  imports: [NgTemplateOutlet, MatSidenavModule, MatPaginatorModule, NgIcon, ProductCard, FiltersPanel],
  templateUrl: './products.html',
  styleUrl: './products.css',
  providers: [provideIcons({ faSolidSliders, faSolidXmark })],
})
export class Products {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filterService = inject(ProductFilterService);
  private readonly responsivePageSize = inject(ResponsivePageSizeService);

  // The full catalog is resolved once by the route (see products.resolver.ts) and never
  // refetched; everything below reacts to query param changes on that same snapshot.
  private readonly allProducts: Product[] = this.route.snapshot.data['products'] ?? [];

  categories = this.categoriesService.getCategories();
  priceRanges = PRICE_RANGES;
  sortOptions = SORT_OPTIONS;
  states = US_STATES;

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  category = computed(() => this.queryParamMap().get('category') ?? '');
  priceRange = computed(() => this.queryParamMap().get('price') ?? '');
  sort = computed(() => (this.queryParamMap().get('sort') as SortKey | null) ?? '');
  state = computed(() => this.queryParamMap().get('state') ?? '');
  zip = computed(() => this.queryParamMap().get('zip') ?? '');
  search = computed(() => this.queryParamMap().get('q') ?? '');

  hasActiveFilters = computed(
    () => !!(this.category() || this.priceRange() || this.sort() || this.state() || this.zip() || this.search()),
  );

  activeCategoryName = computed(
    () => this.categoriesService.getCategoryBySlug(this.category())?.name,
  );

  filteredProducts = computed(() => {
    const filtered = this.filterService.filter(this.allProducts, {
      category: this.category() || undefined,
      priceRange: this.priceRange() || undefined,
      state: this.state() || undefined,
      search: this.search() || undefined,
    });
    return this.filterService.sort(filtered, this.sort() || undefined);
  });

  pageSizeOptions = this.responsivePageSize.pageSizeOptions;
  pageSize = computed(
    () => Number(this.queryParamMap().get('pageSize')) || this.responsivePageSize.defaultPageSize(),
  );
  pageIndex = computed(() => Number(this.queryParamMap().get('page')) || 0);

  pagedProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  mobileFiltersOpen = signal(false);

  toggleFilters(): void {
    this.mobileFiltersOpen.update((open) => !open);
  }

  closeFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  onCategorySelected(slug: string): void {
    this.updateQueryParams({ category: this.category() === slug ? null : slug });
  }

  onPriceRangeSelected(range: string): void {
    this.updateQueryParams({ price: this.priceRange() === range ? null : range });
  }

  onSortSelected(sort: SortKey): void {
    this.updateQueryParams({ sort: this.sort() === sort ? null : sort });
  }

  onStateSelected(state: string): void {
    this.updateQueryParams({ state: state || null });
  }

  onZipChanged(zip: string): void {
    this.updateQueryParams({ zip: zip || null });
  }

  onSearchChanged(term: string): void {
    this.updateQueryParams({ q: term || null });
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.closeFilters();
  }

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

  private updateQueryParams(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      // A filter change invalidates whatever page the user was on, so always reset it.
      queryParams: { ...params, page: null },
      queryParamsHandling: 'merge',
    });
    this.closeFilters();
  }
}
