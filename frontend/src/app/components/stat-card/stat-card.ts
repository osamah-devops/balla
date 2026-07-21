import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type StatCardAccent = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';

const ACCENT_CLASSES: Record<StatCardAccent, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
};

@Component({
  selector: 'app-stat-card',
  imports: [NgIcon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  label = input.required<string>();
  value = input.required<string | number>();
  icon = input.required<string>();
  hint = input<string>('');
  accent = input<StatCardAccent>('indigo');

  get accentClass(): string {
    return ACCENT_CLASSES[this.accent()];
  }
}
