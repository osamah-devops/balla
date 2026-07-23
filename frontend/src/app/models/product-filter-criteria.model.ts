export type SortKey = 'newest' | 'best-selling' | 'price-asc';

/**
 * "best-selling" is accepted but currently a no-op: the dataset has no sales-volume
 * field to sort by, so it falls back to catalog order rather than fabricate a signal
 * that doesn't exist. "newest" sorts by the listing's createdAt timestamp.
 */
export interface ProductFilterCriteria {
  category?: string;
  state?: string;
  /** Digits-only prefix match against the seller's zip code (e.g. "551" matches 55401). */
  zip?: string;
  priceRange?: string;
  sort?: SortKey;
  search?: string;
}
