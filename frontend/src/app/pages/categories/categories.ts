import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  private readonly route = inject(ActivatedRoute);
  categories: Category[] = this.route.snapshot.data['categories'] ?? [];
}
