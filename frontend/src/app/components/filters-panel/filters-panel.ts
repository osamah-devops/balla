import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Category } from '../../models/category.model';
import { SortKey } from '../../models/product-filter-criteria.model';

export interface SortOption {
  label: string;
  key: SortKey;
}

/**
 * Presentational filter UI (SRP): renders category/location/price/sort controls from
 * @Input data and emits @Output selection events. It never navigates or filters
 * anything itself — the host page (Home, Products) decides what a selection means,
 * so the same panel works whether selections should navigate away or filter in place.
 */
@Component({
  selector: 'app-filters-panel',
  imports: [FormsModule, RouterLink, RouterLinkActive, MatCardModule, MatListModule],
  templateUrl: './filters-panel.html',
  styleUrl: './filters-panel.css',
})
export class FiltersPanel {
  categories = input<Category[]>([]);
  priceRanges = input<string[]>([]);
  sortOptions = input<SortOption[]>([]);
  states = input<string[]>([]);

  /** 'route': category items are links to /category/:slug (Home). 'filter': category items filter the current listing in place (Products). */
  categoryMode = input<'route' | 'filter'>('route');

  selectedCategory = input<string>('');
  selectedPriceRange = input<string>('');
  selectedSort = input<SortKey | ''>('');
  selectedState = input<string>('');
  zipCode = input<string>('');

  categorySelected = output<string>();
  priceRangeSelected = output<string>();
  sortSelected = output<SortKey>();
  stateSelected = output<string>();
  zipCodeChanged = output<string>();
}
