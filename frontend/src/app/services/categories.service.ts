import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';

const CATEGORIES: Category[] = [
  { name: 'Automotive', slug: 'automotive', image: '/images/categories/automotive.png' },
  { name: 'Beauty', slug: 'beauty', image: '/images/categories/beauty.png' },
  { name: 'Books & Education', slug: 'books_education', image: '/images/categories/books_education.png' },
  { name: 'Electronics', slug: 'electronics', image: '/images/categories/electronics.png' },
  { name: 'Fashion', slug: 'fashion', image: '/images/categories/fashion.png' },
  { name: 'Gaming', slug: 'gaming', image: '/images/categories/gaming.png' },
  { name: 'Garden', slug: 'garden', image: '/images/categories/garden.png' },
  { name: 'Hobbies & Crafts', slug: 'hobbies_crafts', image: '/images/categories/hobbies_crafts.png' },
  { name: 'Home & Furniture', slug: 'home_furniture', image: '/images/categories/home_furniture.png' },
  { name: 'Kitchen & Dining', slug: 'kitchen_dining', image: '/images/categories/kitchen_dining.png' },
  { name: 'Pet Supplies', slug: 'pet_supplies', image: '/images/categories/pet_supplies.png' },
  { name: 'Photography', slug: 'photography', image: '/images/categories/photography.png' },
  { name: 'Services', slug: 'services', image: '/images/categories/services.png' },
  { name: 'Sports & Fitness', slug: 'sports_fitness', image: '/images/categories/sports_fitness.png' },
  { name: 'Toys & Kids', slug: 'toys_kids', image: '/images/categories/toys_kids.png' },
  { name: 'Travel', slug: 'travel', image: '/images/categories/travel.png' },
];

/**
 * Data access only (SRP). Categories are a small static list today; if they ever move
 * to a backend, only this service changes — nothing that consumes it needs to know.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly categoriesBySlug = new Map(CATEGORIES.map((category) => [category.slug, category]));

  getCategories(): Category[] {
    return CATEGORIES;
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categoriesBySlug.get(slug);
  }
}
