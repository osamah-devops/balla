export type SortKey = 'newest' | 'best-selling' | 'price-asc';

/**
 * "newest" and "best-selling" are accepted but currently no-ops: the dataset has no
 * creation date or sales-volume field to sort by, so both fall back to catalog order
 * rather than fabricate a signal that doesn't exist. Only "price-asc" changes ordering.
 */
export interface ProductFilterCriteria {
  category?: string;
  state?: string;
  priceRange?: string;
  sort?: SortKey;
  search?: string;
}
