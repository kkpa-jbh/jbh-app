import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { JwtInterceptor } from './app/core/infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './app/core/infrastructure/interceptors/error.interceptor';
import { AuthRepository } from './app/core/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from './app/core/infrastructure/repositories/auth.repository.impl';
import { ProductRepository } from './app/core/domain/repositories/product.repository';
import { ProductRepositoryImpl } from './app/core/infrastructure/repositories/product.repository.impl';
import { TeamRepository } from './app/core/domain/repositories/team.repository';
import { TeamRepositoryImpl } from './app/core/infrastructure/repositories/team.repository.impl';
import { PreferencesRepository } from './app/core/domain/repositories/preferences.repository';
import { PreferencesRepositoryImpl } from './app/core/infrastructure/repositories/preferences.repository.impl';
import { BalanceHistoryRepository } from './app/core/domain/repositories/balance-history.repository';
import { BalanceHistoryRepositoryImpl } from './app/core/infrastructure/repositories/balance-history.repository.impl';
import { CategoryRepository } from './app/core/domain/repositories/category.repository';
import { CategoryRepositoryImpl } from './app/core/infrastructure/repositories/category.repository.impl';
import { StatementRepository } from './app/core/domain/repositories/statement.repository';
import { StatementRepositoryImpl } from './app/core/infrastructure/repositories/statement.repository.impl';
import { DevicePlatform } from './app/core/infrastructure/platform/device-platform';
import { IonicDevicePlatform } from '@design-system/platform';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    // Temporary: the pages still import IonicModule, whose elements (ion-select, ion-input...) are only
    // registered by forRoot(). The production build tree-shakes them away without it. Remove after the
    // standalone migration.
    importProvidersFrom(IonicModule.forRoot()),
    provideAnimations(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),

    // i18n Configuration
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en',
      })
    ),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),

    // HTTP Interceptors (order matters!)
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    // Repository implementations (Dependency Injection for Hexagonal Architecture)
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    { provide: ProductRepository, useClass: ProductRepositoryImpl },
    { provide: TeamRepository, useClass: TeamRepositoryImpl },
    { provide: PreferencesRepository, useClass: PreferencesRepositoryImpl },
    { provide: BalanceHistoryRepository, useClass: BalanceHistoryRepositoryImpl },
    { provide: CategoryRepository, useClass: CategoryRepositoryImpl },
    { provide: StatementRepository, useClass: StatementRepositoryImpl },

    // Device questions go through a port; the UI layer answers them with Ionic
    { provide: DevicePlatform, useClass: IonicDevicePlatform },
  ],
});
