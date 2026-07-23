import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { CreateProductRequest, Product } from '../models/product.model';
import { Owner } from '../models/owner.model';
import { Comment } from '../models/comment.model';

/**
 * Data access only (SRP): fetches the product/owner catalogs and exposes simple
 * lookups. Filtering and sorting logic lives in ProductFilterService, not here.
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private products$?: Observable<Product[]>;
  private owners$?: Observable<Owner[]>;

  getProducts(): Observable<Product[]> {
    this.products$ ??= this.http.get<Product[]>('/api/products').pipe(shareReplay(1));
    return this.products$;
  }

  getOwners(): Observable<Owner[]> {
    this.owners$ ??= this.http.get<Owner[]>('/api/owners').pipe(shareReplay(1));
    return this.owners$;
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.getProducts().pipe(map((products) => products.find((product) => product.id === id)));
  }

  getOwnerById(id: string): Observable<Owner | undefined> {
    return this.getOwners().pipe(map((owners) => owners.find((owner) => owner.id === id)));
  }

  getProductsByCategory(categorySlug: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map((products) => products.filter((product) => product.categorySlug === categorySlug)),
    );
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('category', request.category);
    formData.append('categorySlug', request.categorySlug);
    formData.append('price', request.price);
    formData.append('currency', request.currency);
    formData.append('weightLbs', request.weightLbs.toString());
    formData.append('fullDescription', request.fullDescription);
    formData.append('image', request.image);
    for (const extraImage of request.extraImages ?? []) {
      formData.append('extraImages', extraImage);
    }
    if (request.options?.length) {
      formData.append('optionsJson', JSON.stringify(request.options));
    }
    return this.http.post<Product>('/api/products', formData);
  }

  getComments(productId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`/api/products/${productId}/comments`);
  }

  addComment(productId: string, body: string): Observable<Comment> {
    return this.http.post<Comment>(`/api/products/${productId}/comments`, { body });
  }

  rateProduct(productId: string, stars: number): Observable<Product> {
    return this.http.post<Product>(`/api/products/${productId}/ratings`, { stars });
  }
}
