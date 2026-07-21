import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductsService } from '../services/products.service';

export const categoryProductsResolver: ResolveFn<Product[]> = (route) => {
  const slug = route.paramMap.get('id') ?? '';
  return inject(ProductsService).getProductsByCategory(slug);
};
