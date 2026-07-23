export interface ProductOwnerRef {
  id: string;
  name: string;
  location: string;
  state: string;
  zip: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  category: string;
  categorySlug: string;
  title: string;
  price: string;
  currency: string;
  weightLbs: number;
  fullDescription: string;
  specifications?: Record<string, string>;
  owner: ProductOwnerRef;
  image: string;
  extraImages?: string[];
  options?: ProductOption[];
  averageRating: number;
  ratingCount: number;
  hidden: boolean;
  /** ISO-8601 listing timestamp; may be absent on rows created before it existed. */
  createdAt?: string;
}

export interface CreateProductRequest {
  title: string;
  category: string;
  categorySlug: string;
  price: string;
  currency: string;
  weightLbs: number;
  fullDescription: string;
  image: File;
  extraImages?: File[];
  options?: ProductOption[];
}

/** Photos aren't editable after listing — only text/pricing/option fields. */
export interface UpdateProductRequest {
  title: string;
  category: string;
  categorySlug: string;
  price: string;
  currency: string;
  weightLbs: number;
  fullDescription: string;
  options?: ProductOption[];
}
