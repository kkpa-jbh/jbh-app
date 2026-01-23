# Architecture: Hexagonal + DDD + Clean Architecture

## Project Structure
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
│   │   └── [feature-name]/
│   │       ├── pages/           # Ionic pages
│   │       ├── components/      # Feature-specific components
│   │       └── services/        # Feature services
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

## Domain-Driven Design

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
```

### Repository Pattern
```typescript
// core/domain/repositories/product.repository.ts (Interface)
export abstract class ProductRepository {
  abstract findAll(): Observable<Product[]>;
  abstract findById(id: string): Observable<Product>;
  abstract save(product: Product): Observable<void>;
}

// core/infrastructure/repositories/product.repository.impl.ts (Implementation)
@Injectable()
export class ProductRepositoryImpl extends ProductRepository {
  constructor(private http: HttpClient) {
    super();
  }

  findAll(): Observable<Product[]> {
    return this.http.get<any[]>('/api/products').pipe(
      map(data => data.map(item => this.toDomain(item)))
    );
  }
}
```

### Use Cases (Application Services)
```typescript
// core/domain/use-cases/product.use-case.ts
@Injectable({ providedIn: 'root' })
export class ProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  getProducts(): Observable<Product[]> {
    return this.productRepo.findAll();
  }
}
```

## Module Organization

### Core Module (Singletons)
```typescript
@NgModule({
  providers: [
    { provide: ProductRepository, useClass: ProductRepositoryImpl },
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

## Component Pattern

### Always Use Separate Files
NEVER mix HTML and TypeScript:
```typescript
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',  // Separate HTML
  styleUrls: ['./product-list.page.scss'],  // Separate SCSS
  standalone: true,
  imports: [IonicModule, TranslateModule]
})
export class ProductListPage {}
```

## Build Commands
- `ionic serve` - Web development
- `ionic cap run ios -l` - iOS with live reload
- `ionic cap run android -l` - Android with live reload
- `ionic build --prod` - Production build
