import { inject } from '@angular/core';
import { Router, ResolveFn, UrlTree } from '@angular/router';
import { Category } from '../models/category.model';
import { CategoriesService } from '../services/categories.service';

/**
 * Resolves the category for `/category/:id`. An unknown slug resolves to a UrlTree
 * (redirect to /categories) instead of throwing or rendering an empty page.
 */
export const categoryResolver: ResolveFn<Category | UrlTree> = (route) => {
  const categoriesService = inject(CategoriesService);
  const router = inject(Router);
  const slug = route.paramMap.get('id') ?? '';

  return categoriesService.getCategoryBySlug(slug) ?? router.createUrlTree(['/categories']);
};
