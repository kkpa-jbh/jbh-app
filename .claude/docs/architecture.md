# Architecture: Hexagonal + DDD + Clean Architecture

## Project Structure
```
src/
├── app/
│   ├── core/
│   │   ├── domain/                # Business logic layer
│   │   │   ├── features/<feature>/  # api/requests, api/responses, models, types, index.ts
│   │   │   ├── models/           # Shared cross-feature models
│   │   │   ├── repositories/     # Repository interfaces
│   │   │   └── use-cases/        # Business use cases
│   │   ├── formatting/           # Plain TypeScript formatting, no framework
│   │   └── infrastructure/       # Repository implementations, interceptors, auth,
│   │                             # i18n, logging, config, header actions,
│   │                             # DevicePlatform port (platform/device-platform.ts)
│   ├── design-system/            # jbh-* UI adapter layer
│   │   ├── components/           # @design-system/components: icon, forms, display
│   │   └── platform/             # @design-system/platform: page, toolbar, overlays,
│   │                             # navigation, viewport, device-platform
│   ├── shared/                   # App compositions on the layer + jbh* pipes
│   │   ├── components/           # app-header, app-menu, app-category-select, …
│   │   └── pipes/
│   ├── ui/<feature>/             # Lazy-loaded pages and feature components
│   │   ├── pages/
│   │   └── components/
│   ├── app.routes.ts
│   └── app.component.*           # Root shell: ion-app, ion-menu, ion-router-outlet
├── assets/
├── environments/
├── main.ts                       # Providers, repository and DevicePlatform bindings
└── theme/custom-components.scss  # Global tokens, utilities, feature classes
```

## Three adapter layers

The goal: a change of UI framework (Ionic upgrade, no Ionic, another framework) touches only the layer.

1. **UI components** (`design-system/components/`): `jbh-*` wrappers for external-library elements, styled controls with behavior, and repeated markup. Each owns its SCSS. Plain HTML (`div`, `p`, `span`, `h1`, `label`) is not wrapped.
2. **Platform adapters** (`design-system/platform/`): `jbh-page` with `(pageEnter)` / `(pageLeave)`, `jbh-toolbar`, `ToastService`, `DialogService`, `NavigationService`, `JbhViewportService`, `IonicDevicePlatform`. They hide Ionic-only behavior.
3. **Framework-free core** (`core/formatting/`): currency, growth, dates, relative time, display name, translation key, decimal input. Language, time and separators are parameters. The `jbh*` pipes are thin adapters over it.

### Import rules
- `ui` and `shared` import only `@design-system/components` and `@design-system/platform`, never a deeper path, and never `@ionic/*`, `ionicons` or `@swimlane/ngx-charts`.
- `design-system` may import Angular, `@ionic/angular/standalone` (never `@ionic/angular`), `ionicons`, ngx-charts, ngx-translate, `@core/formatting` and some `@core/infrastructure` services. It never imports `@ui/*` or `@shared/*`.
- `core/formatting` imports no framework.
- Core code that needs a platform fact uses the `DevicePlatform` port. `main.ts` binds it to `IonicDevicePlatform`, like the repositories.
- Named exceptions: `src/main.ts`, `src/app/app.component.*`, `src/global.scss`, `src/theme/**`.
- `npm run lint:boundary` checks all of this. It must exit 0. Full rules: `src/app/AGENTS.md`.

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, JbhButtonComponent, JbhPageComponent]
})
export class ProductListPage {}
```

## Build Commands
- `ionic serve` - Web development
- `ionic cap run ios -l` - iOS with live reload
- `ionic cap run android -l` - Android with live reload
- `ionic build --prod` - Production build
