import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
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

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
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
  ],
});
