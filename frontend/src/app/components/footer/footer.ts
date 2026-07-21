import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private readonly categoriesService = inject(CategoriesService);

  readonly year = new Date().getFullYear();
  readonly featuredCategories = this.categoriesService.getCategories().slice(0, 6);
}
