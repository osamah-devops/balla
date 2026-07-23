import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { provideIcons, NgIcon } from '@ng-icons/core';
import {
  faSolidSliders,
  faSolidXmark,
  faSolidChevronLeft,
  faSolidChevronRight,
} from '@ng-icons/font-awesome/solid';
import { FiltersPanel } from '../../components/filters-panel/filters-panel';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { FavoritesService } from '../../services/favorites.service';
import { Product } from '../../models/product.model';
import { Owner } from '../../models/owner.model';
import { SortKey } from '../../models/product-filter-criteria.model';
import { US_STATES } from '../../data/us-states';
import { PRICE_RANGES, SORT_OPTIONS } from '../../data/product-filter-options';

interface HomeSection {
  title: string;
  description: string;
  /** Where "View all →" goes; sections backed by a sortable signal deep-link into it. */
  viewAll: { path: string; queryParams?: Record<string, string> };
  items: Product[];
}

const SLIDE_INTERVAL_MS = 5000;
const SECTION_SIZE = 4;

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9.]/g, '')) || 0;
}

@Component({
  selector: 'app-home',
  imports: [NgTemplateOutlet, MatSidenavModule, MatCardModule, RouterLink, NgIcon, FiltersPanel],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [
    provideIcons({ faSolidSliders, faSolidXmark, faSolidChevronLeft, faSolidChevronRight }),
  ],
})
export class Home implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);

  mobileSidenavOpen = false;
  categories = this.categoriesService.getCategories();
  priceRanges = PRICE_RANGES;
  sortOptions = SORT_OPTIONS;
  states = US_STATES;

  // A 16-slide carousel is too long to sit through and its dot rail turns into
  // clutter — a handful of slides keeps the hero scannable.
  categorySlides = this.categories.slice(0, 6);
  // This app runs zoneless: plain field mutations from setInterval/HTTP callbacks never
  // trigger a re-render on their own (only signal writes and template event bindings do),
  // so anything that changes outside a template event handler must be a signal.
  activeSlide = signal(0);
  private slideTimer?: ReturnType<typeof setInterval>;

  private readonly products = toSignal(this.productsService.getProducts(), { initialValue: [] as Product[] });
  private readonly owners = toSignal(this.productsService.getOwners(), { initialValue: [] as Owner[] });

  // Every section is derived from real catalog signals (price, rating activity,
  // listing date, the visitor's favorites) instead of a hand-picked list, and they
  // recompute automatically when any of those inputs change.
  sections = computed<HomeSection[]>(() => {
    const products = this.products().filter((product) => !product.hidden);
    if (products.length === 0) {
      return [];
    }

    const ownersById = new Map(this.owners().map((owner) => [owner.id, owner]));
    const sellerReviews = (product: Product) => ownersById.get(product.owner.id)?.reviews ?? 0;
    const sellerRating = (product: Product) => ownersById.get(product.owner.id)?.rating ?? 0;

    // Sections never repeat a product, and each favors seller variety: one product
    // per seller while possible, topped up without the cap only when it runs short.
    const used = new Set<string>();
    const take = (pool: Product[]): Product[] => {
      const picked: Product[] = [];
      const sellers = new Set<string>();
      for (const pass of [true, false]) {
        for (const product of pool) {
          if (picked.length === SECTION_SIZE) break;
          if (used.has(product.id) || (pass && sellers.has(product.owner.id))) continue;
          picked.push(product);
          used.add(product.id);
          sellers.add(product.owner.id);
        }
      }
      return picked;
    };

    const byPriceAsc = [...products].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    const byActivity = [...products].sort(
      (a, b) =>
        b.ratingCount - a.ratingCount ||
        b.averageRating - a.averageRating ||
        sellerReviews(b) - sellerReviews(a),
    );
    const byNewest = [...products].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    // Personalized when the visitor has favorites (other products from those same
    // categories); otherwise listings from the marketplace's highest-rated sellers.
    const favoriteIds = this.favoritesService.favoriteIds();
    const favoriteCategories = new Set(
      products.filter((product) => favoriteIds.has(product.id)).map((product) => product.categorySlug),
    );
    const bySellerRating = [...products].sort(
      (a, b) => sellerRating(b) - sellerRating(a) || sellerReviews(b) - sellerReviews(a),
    );
    const recommendedPool = favoriteCategories.size
      ? [
          ...bySellerRating.filter(
            (product) => favoriteCategories.has(product.categorySlug) && !favoriteIds.has(product.id),
          ),
          ...bySellerRating,
        ]
      : bySellerRating;

    return [
      {
        title: 'Featured Deals',
        description: 'The lowest-priced listings on the marketplace right now.',
        viewAll: { path: '/products', queryParams: { sort: 'price-asc' } },
        items: take(byPriceAsc),
      },
      {
        title: 'Trending Now',
        description: 'The most-rated listings from the busiest sellers.',
        viewAll: { path: '/products' },
        items: take(byActivity),
      },
      {
        title: 'Recently Added',
        description: 'The newest listings across every category.',
        viewAll: { path: '/products', queryParams: { sort: 'newest' } },
        items: take(byNewest),
      },
      {
        title: 'Recommended For You',
        description: favoriteCategories.size
          ? 'More from the categories you have favorited.'
          : 'Listings from our highest-rated sellers.',
        viewAll: { path: '/products' },
        items: take(recommendedPool),
      },
    ];
  });

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    this.stopAutoplay();
    this.slideTimer = setInterval(() => this.nextSlide(), SLIDE_INTERVAL_MS);
  }

  stopAutoplay(): void {
    clearInterval(this.slideTimer);
  }

  nextSlide(): void {
    this.activeSlide.update((i) => (i + 1) % this.categorySlides.length);
  }

  prevSlide(): void {
    this.activeSlide.update((i) => (i - 1 + this.categorySlides.length) % this.categorySlides.length);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  toggleFilters(): void {
    this.mobileSidenavOpen = !this.mobileSidenavOpen;
  }

  closeFilters(): void {
    this.mobileSidenavOpen = false;
  }

  // Home has no product listing of its own, so Price/Sort/State selections send the
  // visitor to /products with the choice pre-applied. Category selection is a plain
  // routerLink handled by FiltersPanel (categoryMode="route"); this just closes the
  // mobile drawer after the click.
  onCategorySelected(): void {
    this.closeFilters();
  }

  onPriceRangeSelected(range: string): void {
    this.closeFilters();
    this.router.navigate(['/products'], { queryParams: { price: range } });
  }

  onSortSelected(sort: SortKey): void {
    this.closeFilters();
    this.router.navigate(['/products'], { queryParams: { sort } });
  }

  onStateSelected(state: string): void {
    this.closeFilters();
    if (state) {
      this.router.navigate(['/products'], { queryParams: { state } });
    }
  }

  // The zip input emits per keystroke; only hand off to /products once a full
  // 5-digit zip is entered so typing doesn't yank the visitor off the page.
  onZipChanged(zip: string): void {
    if (/^\d{5}$/.test(zip.trim())) {
      this.closeFilters();
      this.router.navigate(['/products'], { queryParams: { zip: zip.trim() } });
    }
  }
}
