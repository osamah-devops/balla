import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly favoriteIds = signal<Set<string>>(new Set());

  constructor() {
    // Loads (or clears) automatically as the signed-in user changes, so callers never
    // need to remember to fetch this themselves.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.http.get<string[]>('/api/favorites/ids').subscribe((ids) => this.favoriteIds.set(new Set(ids)));
      } else {
        this.favoriteIds.set(new Set());
      }
    });
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().has(productId);
  }

  toggle(productId: string): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    const wasFavorite = this.isFavorite(productId);
    this.favoriteIds.update((set) => {
      const next = new Set(set);
      wasFavorite ? next.delete(productId) : next.add(productId);
      return next;
    });

    const request = wasFavorite
      ? this.http.delete<void>(`/api/favorites/${productId}`)
      : this.http.post<void>(`/api/favorites/${productId}`, {});
    request.subscribe({
      error: () => {
        // Roll back the optimistic update if the request failed.
        this.favoriteIds.update((set) => {
          const next = new Set(set);
          wasFavorite ? next.add(productId) : next.delete(productId);
          return next;
        });
      },
    });
  }

  getFavoriteProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/favorites');
  }
}
