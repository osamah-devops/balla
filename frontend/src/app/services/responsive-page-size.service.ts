import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';

// Must mirror the product grids' own breakpoints (grid-cols-2 sm:grid-cols-3 xl:grid-cols-4,
// used by both products.html and category.html). 3 columns is the odd one out (vs. 2 and 4),
// so it gets its own default page size (9 -> a clean 3x3 grid) instead of 12.
const DEFAULT_PAGE_SIZE = 12;
const THREE_COLUMN_PAGE_SIZE = 9;
const THREE_COLUMN_QUERY = '(min-width: 640px) and (max-width: 1279.98px)';

/**
 * Single source of truth for "how many products per page" across every paginated grid
 * (SRP + DRY): both Products and Category read `defaultPageSize`/`pageSizeOptions` from
 * here instead of each re-deriving their own breakpoint logic. The options list is a
 * single static array (never swapped per breakpoint) so mat-paginator's internal @for
 * never sees its reference change and has to tear down/rebuild the dropdown.
 */
@Injectable({ providedIn: 'root' })
export class ResponsivePageSizeService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isThreeColumnLayout = toSignal(
    this.breakpointObserver.observe(THREE_COLUMN_QUERY).pipe(map((state) => state.matches)),
    { requireSync: true },
  );

  readonly pageSizeOptions = [9, 12, 18, 24, 36, 48];

  readonly defaultPageSize = computed(() =>
    this.isThreeColumnLayout() ? THREE_COLUMN_PAGE_SIZE : DEFAULT_PAGE_SIZE,
  );
}
