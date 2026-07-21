import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidHeart } from '@ng-icons/font-awesome/solid';
import { ProductCard } from '../../components/product-card/product-card';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-favorites',
  imports: [ProductCard, NgIcon, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
  providers: [provideIcons({ faSolidHeart })],
})
export class Favorites {
  private readonly favoritesService = inject(FavoritesService);
  readonly isAuthenticated = inject(AuthService).isAuthenticated;

  readonly products = signal<Product[]>([]);

  constructor() {
    if (this.isAuthenticated()) {
      this.favoritesService.getFavoriteProducts().subscribe((products) => this.products.set(products));
    }
  }
}
