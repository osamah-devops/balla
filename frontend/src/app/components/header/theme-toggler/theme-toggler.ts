import { Component } from '@angular/core';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidSun, faSolidMoon } from '@ng-icons/font-awesome/solid';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'balla-theme';

@Component({
  selector: 'app-theme-toggler',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './theme-toggler.html',
  styleUrl: './theme-toggler.css',
  providers: [provideIcons({ faSolidSun, faSolidMoon })],
})
export class ThemeToggler {
  isDarkMode = false;

  constructor() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(stored ?? (prefersDark ? 'dark' : 'light'));
  }

  toggle() {
    this.applyTheme(this.isDarkMode ? 'light' : 'dark');
  }

  private applyTheme(theme: Theme) {
    this.isDarkMode = theme === 'dark';
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}