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

## THEME SYSTEM REQUIREMENTS

### ALWAYS Check and Use Theme Variables
Before creating any component, ALWAYS check and import theme variables from:
- `src/theme/custom-components.scss` - Component theme variables
- `src/theme/variables.scss` - Ionic color variables

### Component Theming Pattern
```typescript
// ALWAYS reference theme variables, NEVER hardcode styles
@Component({
  selector: 'app-custom-input',
  template: `
    <ion-input 
      class="custom-input"
      [class.has-focus]="isFocused"
      (ionFocus)="isFocused = true"
      (ionBlur)="isFocused = false">
    </ion-input>
  `,
  styleUrls: ['./custom-input.component.scss']
})
export class CustomInputComponent {
  isFocused = false;
}
```
```scss
// custom-input.component.scss
// ALWAYS use theme variables
.custom-input {
  // ✅ CORRECT - Using theme variables
  background: var(--app-input-background);
  border: var(--app-input-border-width) solid var(--app-input-border-color);
  border-radius: var(--app-input-border-radius);
  
  // ❌ WRONG - Never hardcode values
  // background: #ffffff;
  // border: 1px solid #e0e0e0;
  
  &.has-focus {
    border-color: var(--app-input-focus-border-color);
    box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.1);
  }
}
```

### Theme Variable Naming Convention
```scss
// Component-specific variables should follow this pattern:
// --app-[component]-[property]: value;

--app-input-background: #ffffff;
--app-button-height: 48px;
--app-card-shadow: 0 2px 4px rgba(0,0,0,0.1);

// State variations:
--app-input-error-border-color: var(--ion-color-danger);
--app-input-disabled-background: #f5f5f5;
--app-button-hover-background: var(--ion-color-primary-shade);
```

### Form Components Must Use Consistent Theming
```html
<!-- All form elements must use theme classes -->
<form [formGroup]="myForm">
  <ion-item class="form-item">
    <ion-label position="floating">Name</ion-label>
    <ion-input class="custom-input" formControlName="name"></ion-input>
  </ion-item>
  
  <ion-item class="form-item">
    <ion-label position="floating">Description</ion-label>
    <ion-textarea class="custom-textarea" formControlName="description"></ion-textarea>
  </ion-item>
  
  <ion-checkbox class="custom-checkbox" formControlName="agree">
    I agree to terms
  </ion-checkbox>
  
  <ion-button class="button-primary" expand="block" type="submit">
    Submit
  </ion-button>
</form>
```

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

## Critical Rules
1. NEVER hardcode colors, sizes, or spacing - ALWAYS use theme variables
2. ALWAYS test responsive behavior on at least 3 viewport sizes
3. ALWAYS check `src/theme/custom-components.scss` before styling any input component
4. ALWAYS use Ionic Grid system for responsive layouts
5. NEVER use fixed pixel widths for containers (except max-width)
6. ALWAYS implement mobile-first CSS (start with mobile, add media queries for larger screens)
7. The documentation of the project is located under the notes folder