import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, filter, startWith, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-nav',
  imports: [NgClass, RouterLink, RouterLinkActive],
  templateUrl: './main-nav.html',
  styleUrl: './main-nav.css',
})
export class MainNav {
  @Input() mobile = false;
  @Output() linkClick = new EventEmitter<void>();
  @Output() routePathChange = new EventEmitter<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = event ? event.urlAfterRedirects : this.router.url;
        this.routePathChange.emit(this.normalizePath(url));
      });
  }

  private normalizePath(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}