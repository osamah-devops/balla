import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Category } from '../models/category.model';
import { CategoriesService } from '../services/categories.service';

export const categoriesResolver: ResolveFn<Category[]> = () =>
  inject(CategoriesService).getCategories();
