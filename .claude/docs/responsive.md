# Responsive Design

## Breakpoints
- **Mobile**: 320px - 768px (iOS & Android)
- **Tablet**: 768px - 1024px (iPad, Android tablets)
- **Desktop**: 1024px+ (PWA)

## Ionic Grid System
```html
<ion-grid>
  <ion-row>
    <!-- Mobile: full, Tablet: half, Desktop: third -->
    <ion-col size="12" size-md="6" size-lg="4">
      <app-card></app-card>
    </ion-col>
  </ion-row>
</ion-grid>
```

## SCSS Pattern (Mobile-First)

```scss
.container {
  padding: 16px;

  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  // Tablet
  @media (min-width: 768px) {
    padding: 24px;
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  // Desktop
  @media (min-width: 1024px) {
    max-width: 1200px;
    margin: 0 auto;
    .grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
```

## Viewport Detection

```typescript
import { Platform } from '@ionic/angular';

@Component({...})
export class MyPage {
  isMobile = true;
  isTablet = false;
  isDesktop = false;

  constructor(private platform: Platform) {
    this.checkViewport();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  private checkViewport(): void {
    const width = this.platform.width();
    this.isMobile = width < 768;
    this.isTablet = width >= 768 && width < 1024;
    this.isDesktop = width >= 1024;
  }
}
```

## Conditional Layouts

```html
<!-- Mobile: List -->
@if (isMobile) {
  <ion-list>
    @for (item of items; track item.id) {
      <ion-item>{{ item.name }}</ion-item>
    }
  </ion-list>
}

<!-- Tablet/Desktop: Grid -->
@if (!isMobile) {
  <div class="grid-layout">
    @for (item of items; track item.id) {
      <app-card [item]="item"></app-card>
    }
  </div>
}
```

## Testing Devices
1. iPhone SE (375px) - Smallest mobile
2. iPhone 14 (390px) - Standard mobile
3. iPad (768px) - Tablet portrait
4. iPad Pro (1024px) - Tablet landscape
5. Desktop (1440px) - Standard desktop

Use Chrome DevTools device emulation.

## Rules
- **ALWAYS** use Ionic Grid for responsive layouts
- **NEVER** use fixed pixel widths (except max-width)
- **ALWAYS** implement mobile-first CSS
- **ALWAYS** test on 3+ viewport sizes
