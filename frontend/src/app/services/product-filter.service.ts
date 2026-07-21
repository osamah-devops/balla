import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { ProductFilterCriteria, SortKey } from '../models/product-filter-criteria.model';

const STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY',
};

const PRICE_RANGE_PREDICATES: Record<string, (price: number) => boolean> = {
  'Under $50': (price) => price < 50,
  '$50 - $100': (price) => price >= 50 && price <= 100,
  '$100 - $200': (price) => price >= 100 && price <= 200,
  'Above $200': (price) => price > 200,
};

// Open/Closed: a new sort option is a new entry here, not a change to existing branches.
// "newest" and "best-selling" are intentionally identity comparators — the dataset has no
// creation date or sales-volume field, so they preserve catalog order rather than fake one.
const SORT_COMPARATORS: Record<SortKey, (a: Product, b: Product) => number> = {
  newest: () => 0,
  'best-selling': () => 0,
  'price-asc': (a, b) => parsePrice(a.price) - parsePrice(b.price),
};

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9.]/g, '')) || 0;
}

/**
 * Pure filter/sort logic (SRP), kept independent of how products are fetched or
 * displayed so it can be reused and tested on its own.
 */
@Injectable({ providedIn: 'root' })
export class ProductFilterService {
  filter(products: Product[], criteria: ProductFilterCriteria): Product[] {
    let result = products;

    if (criteria.category) {
      result = result.filter((product) => product.categorySlug === criteria.category);
    }

    if (criteria.state) {
      const abbreviation = STATE_ABBREVIATIONS[criteria.state];
      if (abbreviation) {
        result = result.filter((product) => product.owner.location.endsWith(`, ${abbreviation}`));
      }
    }

    if (criteria.priceRange) {
      const matchesRange = PRICE_RANGE_PREDICATES[criteria.priceRange];
      if (matchesRange) {
        result = result.filter((product) => matchesRange(parsePrice(product.price)));
      }
    }

    if (criteria.search) {
      const term = criteria.search.trim().toLowerCase();
      if (term) {
        result = result.filter(
          (product) =>
            product.title.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            product.fullDescription.toLowerCase().includes(term) ||
            product.owner.name.toLowerCase().includes(term),
        );
      }
    }

    return result;
  }

  sort(products: Product[], sortKey?: SortKey): Product[] {
    if (!sortKey) {
      return products;
    }
    const compare = SORT_COMPARATORS[sortKey];
    return compare ? [...products].sort(compare) : products;
  }
}
