# Responsive Design

## Breakpoints
- **Mobile**: 320px - 768px (iOS & Android)
- **Tablet**: 768px - 1024px (iPad, Android tablets)
- **Desktop**: 1024px+ (PWA)

## Grid Layouts (CSS Grid)

The layer has no grid component, and `ion-grid` is not allowed in pages (`npm run lint:boundary`).
Use CSS Grid in the page SCSS.

```html
<div class="feature-grid">
  @for (item of items; track item.id) {
    <app-card [item]="item"></app-card>
  }
</div>
```

`.jbh-balance-summary` is a global grid: 2 columns on mobile, 4 from 768px.

## SCSS Pattern (Mobile-First)

```scss
.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--jbh-spacing-sm);

  // Tablet
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  // Desktop
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

Page width and padding come from `jbh-container` (and `jbh-container-wide`). Do not set them again in the page.

## Viewport Detection

Prefer CSS media queries. Use code only when the logic must change, not only the look.

`JbhViewportService` (`@design-system/platform`): `wide` is a signal, `true` from 1024px.
It updates 100ms after the last resize.

```typescript
import { JbhViewportService } from '@design-system/platform';

@Component({...})
export class MyPage {
  private readonly viewport = inject(JbhViewportService);
  readonly isWide = this.viewport.wide;
}
```

- Never add your own `window:resize` listener.
- `jbh-select` (popover or action sheet) and `jbh-table` (table or cards) already adapt by themselves.

## Conditional Layouts

```html
@if (isWide()) {
  <div class="feature-grid">
    @for (item of items; track item.id) {
      <app-card [item]="item"></app-card>
    }
  </div>
} @else {
  <div class="feature-list">
    @for (item of items; track item.id) {
      <app-item-row [item]="item"></app-item-row>
    }
  </div>
}
```

For tables, do not switch by hand: `jbh-table` shows a table from 768px and cards below 768px.

## Testing Devices
1. iPhone SE (375px) - Smallest mobile
2. iPhone 14 (390px) - Standard mobile
3. iPad (768px) - Tablet portrait
4. iPad Pro (1024px) - Tablet landscape
5. Desktop (1440px) - Standard desktop

Use Chrome DevTools device emulation.

## Rules
- **ALWAYS** use CSS Grid in the page SCSS for responsive layouts. Never `ion-grid`.
- **NEVER** use fixed pixel widths (except max-width)
- **ALWAYS** implement mobile-first CSS
- **ALWAYS** test on 3+ viewport sizes
