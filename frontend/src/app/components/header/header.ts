import { Component, HostListener } from '@angular/core';
import { Logo } from './logo/logo';
import { CommonModule } from '@angular/common';
import { MainNav } from './main-nav/main-nav';
import { AuthNav } from './auth-nav/auth-nav';
import { ThemeToggler } from './theme-toggler/theme-toggler';
import { MobileMenuButton } from './mobile-menu-button/mobile-menu-button';
import { CartLink } from './cart-link/cart-link';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Logo, CommonModule, MainNav, AuthNav, ThemeToggler, MobileMenuButton, CartLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isMobile: boolean = window.innerWidth < 768;
  mobileMenuOpen = false;
  currentPath = window.location.pathname;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth < 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  onMainNavRoutePathChange(path: string) {
    this.currentPath = path;
  }
}
