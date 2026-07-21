import { Component, EventEmitter, Input, Output } from '@angular/core';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { faSolidBars, faSolidXmark } from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-mobile-menu-button',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './mobile-menu-button.html',
  styleUrl: './mobile-menu-button.css',
  providers: [provideIcons({ faSolidBars, faSolidXmark })],
})
export class MobileMenuButton {
  @Input() isOpen = false;
  @Output() toggle = new EventEmitter<void>();
}