import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { Category } from '../../models/category.model';
import { SortKey } from '../../models/product-filter-criteria.model';
import { US_STATES } from '../../data/us-states';
import { PRICE_RANGES, SORT_OPTIONS } from '../../data/product-filter-options';

interface ShowcaseItem extends Category {
  productTitle?: string;
  price?: string;
  ownerName?: string;
}

const SLIDE_INTERVAL_MS = 5000;

function productShowcase(categories: Category[], slugs: string[]): ShowcaseItem[] {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  return slugs.map((slug) => {
    const category = bySlug.get(slug)!;
    return { ...category, image: `/images/products/${slug}.png` };
  });
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
  private readonly router = inject(Router);

  mobileSidenavOpen = false;
  categories = this.categoriesService.getCategories();
  priceRanges = PRICE_RANGES;
  sortOptions = SORT_OPTIONS;
  states = US_STATES;

  categorySlides = this.categories;
  // This app runs zoneless: plain field mutations from setInterval/HTTP callbacks never
  // trigger a re-render on their own (only signal writes and template event bindings do),
  // so anything that changes outside a template event handler must be a signal.
  activeSlide = signal(0);
  private slideTimer?: ReturnType<typeof setInterval>;

  featuredDeals = signal<ShowcaseItem[]>(
    productShowcase(this.categories, ['electronics', 'fashion', 'beauty', 'gaming']),
  );
  trendingNow = signal<ShowcaseItem[]>(
    productShowcase(this.categories, ['sports_fitness', 'home_furniture', 'toys_kids', 'travel']),
  );
  recentlyAdded = signal<ShowcaseItem[]>(
    productShowcase(this.categories, ['kitchen_dining', 'garden', 'pet_supplies', 'photography']),
  );
  recommendedForYou = signal<ShowcaseItem[]>(
    productShowcase(this.categories, [
      'automotive',
      'books_education',
      'hobbies_crafts',
      'services',
    ]),
  );

  ngOnInit(): void {
    this.startAutoplay();
    this.loadShowcaseProducts();
  }

  private loadShowcaseProducts(): void {
    this.productsService.getProducts().subscribe((products) => {
      const firstByCategory = new Map<string, (typeof products)[number]>();
      for (const product of products) {
        if (!firstByCategory.has(product.categorySlug)) {
          firstByCategory.set(product.categorySlug, product);
        }
      }

      const enrich = (items: ShowcaseItem[]): ShowcaseItem[] =>
        items.map((item) => {
          const product = firstByCategory.get(item.slug);
          return product
            ? { ...item, productTitle: product.title, price: product.price, ownerName: product.owner.name }
            : item;
        });

      this.featuredDeals.set(enrich(this.featuredDeals()));
      this.trendingNow.set(enrich(this.trendingNow()));
      this.recentlyAdded.set(enrich(this.recentlyAdded()));
      this.recommendedForYou.set(enrich(this.recommendedForYou()));
    });
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
}
