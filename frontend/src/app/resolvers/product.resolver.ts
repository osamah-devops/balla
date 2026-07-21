import { inject } from '@angular/core';
import { Router, ResolveFn, UrlTree } from '@angular/router';
import { map } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductsService } from '../services/products.service';

/**
 * Resolves the product for `/product/:id`. If the id doesn't match anything in the
 * catalog, resolves to a UrlTree instead of the data — Angular's router treats that
 * as a redirect, so an unknown product id sends the user to /products rather than
 * rendering a broken detail page.
 */
export const productResolver: ResolveFn<Product | UrlTree> = (route) => {
  const productsService = inject(ProductsService);
  const router = inject(Router);
  const id = route.paramMap.get('id') ?? '';

  return productsService
    .getProductById(id)
    .pipe(map((product) => product ?? router.createUrlTree(['/products'])));
};
