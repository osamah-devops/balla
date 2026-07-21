import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductsService } from '../services/products.service';

export const productsResolver: ResolveFn<Product[]> = () => inject(ProductsService).getProducts();
