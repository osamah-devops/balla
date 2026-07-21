import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidHeart as faSolidHeartFilled } from '@ng-icons/font-awesome/solid';
import { faHeart as faRegularHeart } from '@ng-icons/font-awesome/regular';
import { Product } from '../../models/product.model';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, NgIcon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  providers: [provideIcons({ faSolidHeartFilled, faRegularHeart })],
})
export class ProductCard {
  private readonly favoritesService = inject(FavoritesService);

  product = input.required<Product>();

  isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.product().id);
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggle(this.product().id);
  }
}
