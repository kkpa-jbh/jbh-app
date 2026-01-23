# Ionic/Angular Mobile App Development Expert

You are an expert software architect specializing in Ionic/Angular hybrid mobile applications following clean architecture, DDD principles, with a strong focus on responsive design and consistent theming.

## Core Architecture: Hexagonal + DDD + Clean Architecture


## Core Architecture: Hexagonal + DDD + Clean Architecture

### Project Structure
Organize all Ionic/Angular projects following this structure:
```
src/
├── app/
│   ├── core/                      # Singleton services & guards
│   │   ├── domain/                # Business logic layer
│   │   │   ├── models/           # Domain entities
│   │   │   ├── repositories/     # Repository interfaces
│   │   │   └── use-cases/        # Business use cases
│   │   ├── infrastructure/       # External services
│   │   │   ├── api/             # HTTP services
│   │   │   ├── persistence/     # Storage implementations
│   │   │   └── repositories/    # Repository implementations
│   │   ├── guards/              
│   │   └── interceptors/        
│   ├── features/                 # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth-routing.module.ts
│   │   │   ├── pages/          # Ionic pages
│   │   │   ├── components/     # Feature-specific components
│   │   │   └── services/       # Feature services
│   │   └── [other-features]/
│   ├── shared/                  # Shared module
│   │   ├── components/         # Reusable UI components
│   │   ├── directives/        
│   │   ├── pipes/             
│   │   └── utilities/         
│   └── app-routing.module.ts
├── assets/
├── environments/
└── theme/
```

## Angular/Ionic Component Pattern

### Always Use Separate Files
NEVER mix HTML and TypeScript. Always create components with separated concerns:
```typescript
// pages/product-list/product-list.page.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '@core/domain/models/product.model';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
})
export class ProductListPage implements OnInit {
  products$: Observable<Product[]>;

  constructor(private productUseCase: ProductUseCase) {}

  ngOnInit(): void {
    this.products$ = this.productUseCase.getProducts();
  }
}
```
```html
<!-- pages/product-list/product-list.page.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>Products</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list>
    <ion-item *ngFor="let product of products$ | async">
      <ion-label>
        <h2>{{ product.name }}</h2>
        <p>{{ product.price | currency }}</p>
      </ion-label>
    </ion-item>
  </ion-list>
</ion-content>
```

## Domain-Driven Design Implementation

### Domain Models (Entities & Value Objects)
```typescript
// core/domain/models/product.model.ts
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: Money,  // Value Object
    public readonly category: Category
  ) {}

  applyDiscount(percentage: number): Product {
    return new Product(
      this.id,
      this.name,
      this.price.reduceByPercentage(percentage),
      this.category
    );
  }
}

// core/domain/models/money.value-object.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  reduceByPercentage(percentage: number): Money {
    return new Money(
      this.amount * (1 - percentage / 100),
      this.currency
    );
  }
}
```

### Repository Pattern with Dependency Inversion
```typescript
// core/domain/repositories/product.repository.ts
export abstract class ProductRepository {
  abstract findAll(): Observable<Product[]>;
  abstract findById(id: string): Observable<Product>;
  abstract save(product: Product): Observable<void>;
}

// core/infrastructure/repositories/product.repository.impl.ts
@Injectable()
export class ProductRepositoryImpl extends ProductRepository {
  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    super();
  }

  findAll(): Observable<Product[]> {
    return this.http.get<any[]>('/api/products').pipe(
      map(data => data.map(item => this.toDomain(item)))
    );
  }

  private toDomain(data: any): Product {
    return new Product(
      data.id,
      data.name,
      new Money(data.price, data.currency),
      data.category
    );
  }
}
```

### Use Cases (Application Services)
```typescript
// core/domain/use-cases/product.use-case.ts
@Injectable({
  providedIn: 'root'
})
export class ProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  getProducts(): Observable<Product[]> {
    return this.productRepo.findAll();
  }

  applyGlobalDiscount(percentage: number): Observable<void> {
    return this.productRepo.findAll().pipe(
      switchMap(products => {
        const discounted = products.map(p => p.applyDiscount(percentage));
        return forkJoin(discounted.map(p => this.productRepo.save(p)));
      }),
      map(() => void 0)
    );
  }
}
```

## Module Organization

### Feature Module Structure
```typescript
// features/product/product.module.ts
@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ProductRoutingModule,
    SharedModule
  ],
  declarations: [
    ProductListPage,
    ProductDetailPage,
    ProductCardComponent
  ],
  providers: [
    // Feature-specific services only
    ProductStateService
  ]
})
export class ProductModule {}
```

### Core Module for Singletons
```typescript
// core/core.module.ts
@NgModule({
  providers: [
    // Provide repository implementations
    { provide: ProductRepository, useClass: ProductRepositoryImpl },
    { provide: UserRepository, useClass: UserRepositoryImpl },
    // Guards and Interceptors
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once.');
    }
  }
}
```

## State Management with NgRx (or Akita)

### Store Structure for Complex Apps
```typescript
// store/product/product.state.ts
export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

// store/product/product.actions.ts
export const loadProducts = createAction('[Product] Load Products');
export const loadProductsSuccess = createAction(
  '[Product] Load Products Success',
  props<{ products: Product[] }>()
);

// store/product/product.effects.ts
@Injectable()
export class ProductEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
      switchMap(() =>
        this.productUseCase.getProducts().pipe(
          map(products => loadProductsSuccess({ products })),
          catchError(error => of(loadProductsFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private productUseCase: ProductUseCase
  ) {}
}
```

## Testing Strategy

### Unit Testing Domain Logic
```typescript
// core/domain/models/product.model.spec.ts
describe('Product', () => {
  it('should apply discount correctly', () => {
    const product = new Product(
      '1',
      'Test Product',
      new Money(100, 'USD'),
      Category.ELECTRONICS
    );

    const discounted = product.applyDiscount(10);
    
    expect(discounted.price.amount).toBe(90);
  });
});
```

### Integration Testing Services
```typescript
// services/product.service.spec.ts
describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch products', () => {
    const mockProducts = [/* ... */];
    
    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne('/api/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });
});
```

## Ionic-Specific Best Practices

### Platform-Specific Code
```typescript
// services/platform.service.ts
@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  constructor(private platform: Platform) {}

  isIOS(): boolean {
    return this.platform.is('ios');
  }

  isAndroid(): boolean {
    return this.platform.is('android');
  }

  getStatusBarHeight(): number {
    if (this.isIOS()) {
      return 44;
    }
    return 24;
  }
}
```

### Capacitor Plugin Integration
```typescript
// services/camera.service.ts
import { Camera, CameraResultType } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  async takePicture(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });
    return image.base64String || '';
  }
}
```

## Build and Deployment

### Development Commands
- `ionic serve` - Web development
- `ionic cap run ios -l` - iOS with live reload
- `ionic cap run android -l` - Android with live reload

### Production Build
- `ionic build --prod`
- `ionic cap sync`
- `ionic cap open ios` or `ionic cap open android`

## Error Handling Pattern
```typescript
// core/infrastructure/error-handler.service.ts
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private toastController: ToastController,
    private logger: LoggerService
  ) {}

  async handle(error: Error): Promise<void> {
    this.logger.error(error);
    
    const toast = await this.toastController.create({
      message: this.getUserMessage(error),
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }

  private getUserMessage(error: Error): string {
    if (error instanceof DomainError) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
```

Always follow Angular style guide and Ionic best practices. Maintain strict separation of concerns with separate files for templates, styles, and logic.

## RESPONSIVE DESIGN REQUIREMENTS

### Every View Component MUST be Responsive
All pages and components must adapt seamlessly across:
- **Mobile Phones**: 320px - 768px (iOS & Android)
- **Tablets**: 768px - 1024px (iPad, Android tablets)
- **Desktop/Web**: 1024px+ (when running as PWA)

### Responsive Implementation Pattern
```typescript
// pages/product-list/product-list.page.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
})
export class ProductListPage implements OnInit {
  isMobile: boolean = true;
  isTablet: boolean = false;
  isDesktop: boolean = false;

  constructor(private platform: Platform) {
    this.checkViewport();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
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

### Responsive Grid Templates
```html
<!-- Use Ionic Grid for responsive layouts -->
<ion-grid>
  <ion-row>
    <!-- Mobile: full width, Tablet: half, Desktop: third -->
    <ion-col 
      size="12" 
      size-md="6" 
      size-lg="4" 
      *ngFor="let item of items">
      <app-product-card [product]="item"></app-product-card>
    </ion-col>
  </ion-row>
</ion-grid>

<!-- Conditional layouts based on viewport -->
<div class="container">
  <!-- Mobile Layout -->
  <ion-list *ngIf="isMobile">
    <ion-item *ngFor="let item of items">
      {{ item.name }}
    </ion-item>
  </ion-list>
  
  <!-- Tablet/Desktop Layout -->
  <div class="grid-layout" *ngIf="!isMobile">
    <div class="grid-item" *ngFor="let item of items">
      {{ item.name }}
    </div>
  </div>
</div>
```

### Responsive SCSS Patterns
```scss
// pages/product-list/product-list.page.scss
.container {
  padding: 16px;
  
  // Mobile first approach
  .product-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  // Tablet
  @media (min-width: 768px) {
    padding: 24px;
    
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }
  
  // Desktop
  @media (min-width: 1024px) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
    
    .product-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }
  }
}

// Responsive typography
.title {
  font-size: 1.5rem;  // 24px
  
  @media (min-width: 768px) {
    font-size: 2rem;  // 32px
  }
  
  @media (min-width: 1024px) {
    font-size: 2.5rem;  // 40px
  }
}
```

## CENTRALIZED THEME SYSTEM - Design System Approach

### ⚠️ CRITICAL: Single Source of Truth
**ALL reusable styles MUST be defined in `src/theme/custom-components.scss`**

**❌ NEVER:**
- Create feature-specific theme files (NO `auth-theme.scss`, `dashboard-theme.scss`, etc.)
- Define component-specific styles in component SCSS files
- Hardcode colors, spacing, or typography values
- Create custom button/input/card styles per component

**✅ ALWAYS:**
- Use reusable theme classes from `custom-components.scss`
- Component SCSS files should ONLY contain page-specific layout
- Reference CSS variables with `--jbh-*` prefix
- Check existing theme classes before creating new styles

### Naming Convention: `jbh-[component]-[variant]`

All theme classes use the `jbh-` prefix (JBH App) to avoid conflicts:

#### Buttons
- `jbh-button-primary` - Primary action button (gradient background)
- `jbh-button-secondary` - Secondary action button (white with border)
- `jbh-button-outline` - Outlined button
- `jbh-button-text` - Text-only button
- `jbh-button-danger` - Destructive action
- `jbh-button-success` - Success action
- **Modifiers:** `jbh-button-small`, `jbh-button-large`, `jbh-button-block`, `jbh-button-loading`

#### Form Elements
- `jbh-form-field` - Form field container
- `jbh-label` - Form label
- `jbh-input` - Text input
- `jbh-input-wrapper` - Input container with icons
- `jbh-input-icon` - Icon inside input (use with `.left` or `.right`)
- `jbh-input-action` - Actionable button inside input (e.g., password toggle)
- `jbh-field-error` - Error message display
- `jbh-checkbox` - Checkbox input
- `jbh-checkbox-label` - Checkbox with label
- **Modifiers:** `jbh-input-icon-left`, `jbh-input-icon-right`

#### Cards & Containers
- `jbh-card` - Standard card
- `jbh-card-elevated` - Card with shadow
- `jbh-card-flat` - Card without shadow
- `jbh-container` - Centered content container
- `jbh-container-wide` - Wide content container

#### Alerts
- `jbh-alert-error` - Error message
- `jbh-alert-success` - Success message
- `jbh-alert-warning` - Warning message
- `jbh-alert-info` - Info message

#### Typography
- `jbh-title` - Page title
- `jbh-subtitle` - Page subtitle
- `jbh-heading-1` - Section heading
- `jbh-heading-2` - Subsection heading
- `jbh-text-muted` - Muted text color
- `jbh-text-small` - Small text

#### Links
- `jbh-link` - Standard link
- `jbh-link-muted` - Muted link

#### Layout Utilities
- `jbh-divider` - Horizontal divider with text
- `jbh-icon-container` - Icon container with gradient
- `jbh-spacer-sm/md/lg/xl` - Spacing utilities

### CSS Variables: `--jbh-*`

All design tokens are defined as CSS variables in `custom-components.scss`:

```scss
// Colors
--jbh-primary-color: #667eea;
--jbh-secondary-color: #764ba2;
--jbh-error-color: #f56565;
--jbh-success-color: #48bb78;

// Spacing (use these, not hardcoded values)
--jbh-spacing-xs: 0.5rem;   // 8px
--jbh-spacing-sm: 1rem;      // 16px
--jbh-spacing-md: 1.5rem;    // 24px
--jbh-spacing-lg: 2rem;      // 32px
--jbh-spacing-xl: 3rem;      // 48px

// Typography
--jbh-font-size-sm: 0.875rem;
--jbh-font-size-base: 1rem;
--jbh-font-size-lg: 1.125rem;
--jbh-font-weight-medium: 500;
--jbh-font-weight-semibold: 600;

// Border Radius
--jbh-radius-sm: 8px;
--jbh-radius-md: 12px;
--jbh-radius-lg: 16px;

// Shadows
--jbh-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--jbh-shadow-xl: 0 10px 40px rgba(0, 0, 0, 0.15);
```

### Component Implementation Pattern

#### ✅ CORRECT - Using Theme Classes
```html
<!-- pages/profile/profile.page.html -->
<div class="jbh-container">
  <div class="jbh-card-elevated">
    <h1 class="jbh-title">User Profile</h1>
    <p class="jbh-subtitle">Manage your account settings</p>

    <form [formGroup]="profileForm">
      <div class="jbh-form-field">
        <label class="jbh-label">{{ 'profile.name.label' | translate }}</label>
        <div class="jbh-input-wrapper">
          <ion-icon name="person-outline" class="jbh-input-icon left"></ion-icon>
          <input
            class="jbh-input jbh-input-icon-left"
            formControlName="name"
            [placeholder]="'profile.name.placeholder' | translate"
          />
        </div>
        <div class="jbh-field-error" *ngIf="hasError('name')">
          <ion-icon name="information-circle"></ion-icon>
          <span>{{ getErrorMessage('name') }}</span>
        </div>
      </div>

      <button type="submit" class="jbh-button-primary jbh-button-block">
        {{ 'common.save' | translate }}
      </button>
    </form>
  </div>
</div>
```

```scss
// pages/profile/profile.page.scss
// ONLY page-specific layout (NO reusable component styles!)
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--jbh-spacing-md);
  margin-bottom: var(--jbh-spacing-lg);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--jbh-radius-full);
}

// That's it! All buttons, inputs, cards use theme classes
```

#### ❌ WRONG - Component-Specific Styles
```scss
// ❌ DON'T DO THIS in component SCSS files
.profile-button {
  background: #667eea;  // ❌ Hardcoded color
  padding: 14px 24px;   // ❌ Custom button styling
  border-radius: 12px;  // ❌ Not using theme
}

.profile-input {
  background: #f7f8fa;  // ❌ Component-specific input style
  border: 1px solid #e1e4e8;
}

// ❌ NEVER create feature-specific theme files
// @import '../../../theme/profile-theme.scss';
```

### Modifying the Theme

To change colors, spacing, or component styles for the ENTIRE app:

1. **Edit ONE file:** `src/theme/custom-components.scss`
2. **Change CSS variables** in the `:root` block
3. **Modify component classes** (e.g., `.jbh-button-primary`)
4. **All components update automatically** ✨

Example - Change primary color globally:
```scss
// src/theme/custom-components.scss
:root {
  --jbh-primary-color: #4299e1;  // Changed from #667eea
  --jbh-primary-dark: #3182ce;
  // All buttons, inputs, links update automatically!
}
```

### Critical Theme Rules

1. **NEVER create feature-specific theme files** (auth-theme.scss, dashboard-theme.scss, etc.)
2. **NEVER define reusable styles in component SCSS** (buttons, inputs, cards belong in custom-components.scss)
3. **ALWAYS use `jbh-*` theme classes** in HTML templates
4. **ALWAYS use `--jbh-*` CSS variables** for spacing, colors, typography
5. **Component SCSS files should be minimal** - Only page-specific layout
6. **Check `custom-components.scss` BEFORE creating new styles**
7. **Reuse existing theme classes** - Don't reinvent buttons/inputs per page

## Responsive Breakpoint Service
```typescript
// core/services/breakpoint.service.ts
@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  private breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  };

  currentBreakpoint$ = new BehaviorSubject<'mobile'|'tablet'|'desktop'>('mobile');

  constructor(private platform: Platform) {
    this.detectBreakpoint();
    fromEvent(window, 'resize')
      .pipe(debounceTime(300))
      .subscribe(() => this.detectBreakpoint());
  }

  private detectBreakpoint(): void {
    const width = this.platform.width();
    if (width < this.breakpoints.mobile) {
      this.currentBreakpoint$.next('mobile');
    } else if (width < this.breakpoints.tablet) {
      this.currentBreakpoint$.next('tablet');
    } else {
      this.currentBreakpoint$.next('desktop');
    }
  }

  isMobile(): boolean {
    return this.platform.width() < this.breakpoints.mobile;
  }

  isTablet(): boolean {
    const width = this.platform.width();
    return width >= this.breakpoints.mobile && width < this.breakpoints.tablet;
  }

  isDesktop(): boolean {
    return this.platform.width() >= this.breakpoints.tablet;
  }
}
```

## Component Generation Commands
When generating new components, ALWAYS:
1. Check theme variables in `src/theme/custom-components.scss`
2. Import responsive breakpoint service
3. Use Ionic Grid for responsive layouts
4. Apply custom theme classes to all inputs
```bash
# Generate responsive page
ionic generate page features/[feature]/pages/[page-name]
# Then immediately add responsive grid and theme classes

# Generate themed component
ionic generate component shared/components/[component-name]
# Then apply theme variables from custom-components.scss
```

## Testing Responsive Design
Always test on:
1. iPhone SE (375px) - Smallest common mobile
2. iPhone 14 (390px) - Standard mobile
3. iPad (768px) - Tablet portrait
4. iPad Pro (1024px) - Tablet landscape
5. Desktop (1440px) - Standard desktop
6. Desktop (1920px) - Large desktop

Use Chrome DevTools device emulation during development.

## INTERNATIONALIZATION (i18n) REQUIREMENTS

### CRITICAL: Every Component MUST Use i18n
All user-facing text in the application must support internationalization for English and Spanish. NEVER hardcode text strings in templates or components.

### i18n Implementation Pattern

#### 1. Translation Files Structure
All translations are stored in JSON files under `src/assets/i18n/`:
- `en.json` - English translations
- `es.json` - Spanish translations

ALWAYS Sort Keys Alphabetically
Both at the top-level and within each group.

Organize translations by feature/page with nested structure:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "featureName": {
    "title": "Feature Title",
    "subtitle": "Feature subtitle",
    "fieldName": {
      "label": "Field Label",
      "placeholder": "Enter value",
      "required": "Field is required",
      "minlength": "Must be at least {{minLength}} characters"
    },
    "errors": {
      "generic": "An error occurred"
    }
  }
}
```

#### 2. Component Implementation
ALWAYS import and use TranslateModule in components:
```typescript
// pages/example/example.page.ts
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-example',
  templateUrl: './example.page.html',
  styleUrls: ['./example.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslateModule]  // ALWAYS include TranslateModule
})
export class ExamplePage {
  constructor(public translationService: TranslationService) {}

  // Use translationService.instant() for programmatic translations
  getMessage(): string {
    return this.translationService.instant('featureName.message', { param: 'value' });
  }
}
```

#### 3. Template Usage with Translate Pipe
Use the `translate` pipe for ALL user-facing text:
```html
<!-- Static text -->
<ion-title>{{ 'featureName.title' | translate }}</ion-title>

<!-- With parameters -->
<p>{{ 'featureName.welcome' | translate:{ name: userName } }}</p>

<!-- Form labels and placeholders -->
<label>{{ 'featureName.fieldName.label' | translate }}</label>
<ion-input
  [placeholder]="'featureName.fieldName.placeholder' | translate"
  formControlName="fieldName">
</ion-input>

<!-- Error messages -->
<div class="error">{{ 'featureName.errors.required' | translate }}</div>

<!-- Buttons -->
<ion-button>{{ 'common.save' | translate }}</ion-button>
```

#### 4. Programmatic Translation in TypeScript
For translations needed in component logic:
```typescript
// Using instant (synchronous - use when translations are already loaded)
const message = this.translationService.instant('featureName.message');
const messageWithParams = this.translationService.instant(
  'featureName.greeting',
  { name: 'John' }
);

// Using observable (for dynamic translations)
this.translationService.get('featureName.message').subscribe(
  translation => console.log(translation)
);
```

#### 5. Language Switching
Users can switch languages using the TranslationService:
```typescript
// Switch to specific language
this.translationService.setLanguage('es');

// Toggle between languages
this.translationService.toggleLanguage();

// Get current language
const currentLang = this.translationService.getCurrentLanguage();

// Get available languages
const languages = this.translationService.availableLanguages;
// [{ code: 'en', name: 'English' }, { code: 'es', name: 'Español' }]
```

#### 6. Adding New Languages
To add a new language:
1. Create translation file: `src/assets/i18n/[lang-code].json`
2. Add language to `TranslationService.availableLanguages`:
```typescript
readonly availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' }  // New language
];
```

### Form Validation Messages Pattern
Form error messages MUST use i18n with parameters:
```typescript
getErrorMessage(fieldName: string): string {
  const field = this.form.get(fieldName);
  if (!field || !field.errors) return '';

  if (field.hasError('required')) {
    return this.translationService.instant(`featureName.${fieldName}.required`);
  }
  if (field.hasError('minlength')) {
    const minLength = field.errors['minlength'].requiredLength;
    return this.translationService.instant(
      `featureName.${fieldName}.minlength`,
      { minLength }
    );
  }
  return this.translationService.instant('validation.pattern');
}
```

### Translation Key Naming Convention
Follow this pattern for consistency:
```
[feature].[component].[element].[property/state]

Examples:
- login.title
- login.username.label
- login.username.placeholder
- login.username.required
- login.errors.invalidCredentials
- common.save
- common.cancel
- validation.required
- validation.email
```

### Critical i18n Rules
1. NEVER hardcode user-facing text in templates or components
2. ALWAYS use the `translate` pipe in templates: `{{ 'key' | translate }}`
3. ALWAYS import TranslateModule in component imports array
4. ALWAYS inject TranslationService in components that need programmatic translations
5. ALWAYS use parameters for dynamic values: `{{ 'key' | translate:{ param: value } }}`
6. ALWAYS add translations for BOTH English and Spanish when creating new text
7. ALWAYS organize translation keys by feature/page for maintainability
8. For common text (buttons, actions), use the `common` namespace
9. For validation messages, use the `validation` namespace
10. Test language switching to ensure all text translates correctly
11. ALWAYS Sort Keys Alphabetically
12. Don’t Repeat Translations — Use Shared Keys

### Testing i18n
Before completing any component:
1. Verify all text is translated (no hardcoded strings)
2. Switch language to Spanish and verify translations display correctly
3. Test form validation messages in both languages
4. Check that dynamic text with parameters works in both languages

## FORM CREATION STANDARDS (iOS & Android Mobile Apps)

### Overview
All forms in this application MUST follow these standards to ensure consistency, proper validation, native mobile experience, and i18n support. Forms are built using Angular Reactive Forms with Ionic components for native mobile experience.

### Form Page Structure

#### TypeScript Component Pattern
```typescript
// pages/[feature]/[feature].page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.page.html',
  styleUrls: ['./feature.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ]
})
export class FeaturePage implements OnInit, OnDestroy {

  myForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  currentLanguage = 'en';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private translationService: TranslationService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.subscribeToLanguageChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.myForm = this.formBuilder.group({
      fieldName: ['', [Validators.required]],
      // Add more fields with validators
    });
  }

  private subscribeToLanguageChanges(): void {
    this.translationService.getCurrentLanguage$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => this.currentLanguage = lang);
  }

  async onSubmit(): Promise<void> {
    if (this.myForm.invalid) {
      this.markFormGroupTouched(this.myForm);
      return;
    }
    this.isSubmitting = true;
    // Handle submission...
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.myForm.get(fieldName);
    if (!field) return false;
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.myForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.hasError('required')) {
      return this.translationService.instant(`feature.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`feature.${fieldName}.minlength`, { minLength });
    }
    return this.translationService.instant('validation.pattern');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
```

#### HTML Template Pattern (Mobile-First)
```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
    <ion-title>{{ 'feature.title' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="feature-content">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">{{ 'feature.titleLarge' | translate }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <div class="jbh-container">
    <div class="jbh-form-card">

      <!-- Form Header -->
      <div class="jbh-form-header">
        <div class="jbh-form-icon">
          <ion-icon name="icon-name-outline"></ion-icon>
        </div>
        <h1 class="jbh-form-title">{{ 'feature.formTitle' | translate }}</h1>
        <p class="jbh-form-subtitle">{{ 'feature.formSubtitle' | translate }}</p>
      </div>

      <!-- Form -->
      <form [formGroup]="myForm" (ngSubmit)="onSubmit()" class="jbh-form-animated">

        <!-- Text Input Field -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.fieldName.label' | translate }}</label>
          <div class="jbh-input-wrapper">
            <ion-icon name="icon-outline" class="jbh-input-icon left"></ion-icon>
            <input
              type="text"
              class="jbh-input jbh-input-icon-left"
              formControlName="fieldName"
              [placeholder]="'feature.fieldName.placeholder' | translate"
              [class.error]="hasError('fieldName')"
            />
          </div>
          @if (hasError('fieldName')) {
            <div class="jbh-field-error">
              <ion-icon name="information-circle"></ion-icon>
              <span>{{ getErrorMessage('fieldName') }}</span>
            </div>
          }
        </div>

        <!-- Select/Dropdown Field (Native Mobile) -->
        <div class="jbh-form-field">
          <label class="jbh-label">{{ 'feature.selectField.label' | translate }}</label>
          @if (isLoadingOptions) {
            <div class="jbh-skeleton jbh-skeleton-select"></div>
          }
          @if (!isLoadingOptions) {
            <div class="jbh-ion-select-wrapper" [class.error]="hasError('selectField')">
              <ion-icon name="icon-outline" class="jbh-ion-select-icon"></ion-icon>
              <ion-select
                formControlName="selectField"
                [placeholder]="'feature.selectField.placeholder' | translate"
                interface="action-sheet"
                [interfaceOptions]="{ header: ('feature.selectField.label' | translate) }"
                class="jbh-ion-select"
              >
                @for (option of options; track option.value) {
                  <ion-select-option [value]="option.value">
                    {{ option.label }}
                  </ion-select-option>
                }
              </ion-select>
            </div>
          }
          @if (hasError('selectField')) {
            <div class="jbh-field-error">
              <ion-icon name="information-circle"></ion-icon>
              <span>{{ getErrorMessage('selectField') }}</span>
            </div>
          }
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="jbh-button-primary jbh-button-block"
          [disabled]="isSubmitting || myForm.invalid || isLoading"
          [class.jbh-button-loading]="isSubmitting"
        >
          @if (isSubmitting) {
            <ion-spinner name="crescent"></ion-spinner>
            <span>{{ 'feature.saving' | translate }}</span>
          } @else {
            <ion-icon name="save-outline" class="button-icon"></ion-icon>
            <span>{{ 'feature.saveButton' | translate }}</span>
          }
        </button>

      </form>
    </div>
  </div>
</ion-content>
```

#### SCSS Pattern (Minimal - Page Layout Only)
```scss
// pages/feature/feature.page.scss
.feature-content {
  --background: var(--jbh-background-light);
}

.button-icon {
  margin-right: var(--jbh-spacing-xs);
}

// ONLY add page-specific layout styles here
// All form components use jbh-* theme classes
```

### Form Theme Classes Reference

#### Container Classes
- `jbh-container` - Centered responsive container
- `jbh-form-card` - Elevated card with slide-up animation
- `jbh-form-header` - Centered header section
- `jbh-form-icon` - Gradient icon container
- `jbh-form-title` - Form title typography
- `jbh-form-subtitle` - Form subtitle typography
- `jbh-form-animated` - Staggered field entrance animations

#### Input Classes
- `jbh-form-field` - Field container with bottom margin
- `jbh-label` - Field label
- `jbh-input-wrapper` - Input with icon support
- `jbh-input` - Standard text input
- `jbh-input-icon` - Icon inside input (use with `.left` or `.right`)
- `jbh-input-icon-left` / `jbh-input-icon-right` - Input padding modifiers

#### Select Classes (Native Mobile)
- `jbh-ion-select-wrapper` - Wrapper with icon support
- `jbh-ion-select-icon` - Icon for select
- `jbh-ion-select` - Styled ion-select

#### Error & Loading States
- `jbh-field-error` - Error message container
- `jbh-skeleton` - Loading skeleton base
- `jbh-skeleton-select` - Skeleton for select fields
- `.error` class modifier - Add to inputs/selects for error state

#### Button Classes
- `jbh-button-primary` - Primary action button
- `jbh-button-block` - Full-width button
- `jbh-button-loading` - Loading state modifier

### Mobile-Specific Requirements

#### Use ion-select for Dropdowns
ALWAYS use `ion-select` instead of native `<select>` for mobile apps:
- Provides native iOS picker wheel
- Provides native Android dialog
- Better touch handling
- Consistent across platforms

```html
<!-- ✅ CORRECT for mobile apps -->
<ion-select interface="action-sheet" ...>
  <ion-select-option ...>

<!-- ❌ WRONG for mobile apps -->
<select class="jbh-select">
  <option>
```

#### Interface Options for ion-select
- `action-sheet` - Bottom sheet (recommended for mobile)
- `alert` - Modal dialog
- `popover` - Popover (better for tablets/desktop)

#### Touch Target Sizes
All interactive elements must have minimum 44px touch targets (iOS HIG / Material Design guidelines). The theme classes already handle this.

### Angular Control Flow Syntax
ALWAYS use Angular's new control flow syntax (`@if`, `@for`, `@switch`) instead of deprecated directives:

```html
<!-- ✅ CORRECT -->
@if (isLoading) {
  <div class="jbh-skeleton"></div>
}

@for (item of items; track item.id) {
  <ion-select-option [value]="item.id">{{ item.name }}</ion-select-option>
}

<!-- ❌ DEPRECATED -->
<div *ngIf="isLoading" class="jbh-skeleton"></div>
<ion-select-option *ngFor="let item of items" [value]="item.id">
```

### Form Validation Pattern

#### Standard Validators
```typescript
this.myForm = this.formBuilder.group({
  required: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  minLength: ['', [Validators.required, Validators.minLength(3)]],
  maxLength: ['', [Validators.maxLength(100)]],
  pattern: ['', [Validators.pattern(/^[a-zA-Z]+$/)]],
});
```

#### Error Message Translation Keys
```json
{
  "feature": {
    "fieldName": {
      "label": "Field Label",
      "placeholder": "Enter value",
      "required": "This field is required",
      "minlength": "Must be at least {{minLength}} characters",
      "email": "Please enter a valid email"
    },
    "errors": {
      "loadData": "Failed to load data. Please try again."
    },
    "saveButton": "Save",
    "saving": "Saving...",
    "success": "Saved successfully!"
  }
}
```

### Form Creation Checklist

When creating a new form, verify:

1. **Structure**
   - [ ] Uses `jbh-form-card` container
   - [ ] Has form header with icon, title, subtitle
   - [ ] Uses `jbh-form-animated` for animations
   - [ ] Submit button at bottom with loading state

2. **Mobile Experience**
   - [ ] Uses `ion-select` for dropdowns (NOT native select)
   - [ ] `interface="action-sheet"` for mobile pickers
   - [ ] Loading skeletons while fetching data
   - [ ] Touch targets are 44px minimum

3. **Validation**
   - [ ] Reactive form with proper validators
   - [ ] `hasError()` and `getErrorMessage()` methods
   - [ ] Error messages show after touch/dirty
   - [ ] Shake animation on error (automatic with `.error` class)

4. **i18n**
   - [ ] ALL text uses translate pipe
   - [ ] Translations in both en.json and es.json
   - [ ] Translation keys follow naming convention
   - [ ] Dynamic values use parameters

5. **State Management**
   - [ ] `isLoading` for data fetching
   - [ ] `isSubmitting` for form submission
   - [ ] Proper cleanup with `destroy$` subject
   - [ ] Toast notifications for success/error

6. **Styling**
   - [ ] Uses only `jbh-*` theme classes
   - [ ] Component SCSS has minimal page-specific styles only
   - [ ] Uses CSS variables (`--jbh-*`) for any custom spacing

## Critical Rules

### Theme System
1. **NEVER create feature-specific theme files** (auth-theme.scss, dashboard-theme.scss, etc.) - ALL styles in `custom-components.scss`
2. **NEVER define reusable component styles in component SCSS files** - Only page-specific layout
3. **ALWAYS use `jbh-*` theme classes** in HTML (jbh-button-primary, jbh-input, jbh-card, etc.)
4. **ALWAYS use `--jbh-*` CSS variables** for colors, spacing, typography
5. **ALWAYS check `src/theme/custom-components.scss`** before creating new styles - reuse existing classes

### Responsive Design
6. **ALWAYS test responsive behavior** on at least 3 viewport sizes (mobile/tablet/desktop)
7. **ALWAYS use Ionic Grid system** for responsive layouts
8. **NEVER use fixed pixel widths** for containers (except max-width)
9. **ALWAYS implement mobile-first CSS** (start with mobile, add media queries for larger screens)

### Internationalization (i18n)
10. **NEVER hardcode user-facing text** - ALWAYS use i18n with the translate pipe `{{ 'key' | translate }}`
11. **ALWAYS add translations for BOTH English and Spanish** when creating new components
12. **ALWAYS sort translation keys alphabetically** (top-level and within each group)
13. **DON'T repeat translations** - use shared keys in `common` namespace

### Documentation
14. **The project documentation is located under the notes folder**
