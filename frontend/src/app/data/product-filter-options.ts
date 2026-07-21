import { SortOption } from '../components/filters-panel/filters-panel';

export const PRICE_RANGES = ['Under $50', '$50 - $100', '$100 - $200', 'Above $200'];

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest', key: 'newest' },
  { label: 'Best Selling', key: 'best-selling' },
  { label: 'Price: Low to High', key: 'price-asc' },
];
