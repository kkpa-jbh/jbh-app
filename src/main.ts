import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { JwtInterceptor } from './app/core/infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './app/core/infrastructure/interceptors/error.interceptor';
import { AuthRepository } from './app/core/domain/repositories/auth.repository';
import { AuthRepositoryImpl } from './app/core/infrastructure/repositories/auth.repository.impl';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),

    // HTTP Interceptors (order matters!)
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    // Repository implementations (Dependency Injection for Hexagonal Architecture)
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
  ],
});
