import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { JwtModule } from '@auth0/angular-jwt';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { provideNgxMask } from 'ngx-mask';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';

import { routes } from './app.routes';
import { tokenGetter } from '@core/token-getter';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Load-bearing: without this, plain async .then() handlers with no
    // subsequent Router navigation (e.g. register/email-confirmation
    // success) never trigger change detection, leaving the UI stuck
    // showing stale state even though the underlying data updated.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    // withInterceptorsFromDi() is load-bearing: it's what wires up JwtModule's JwtInterceptor below.
    provideHttpClient(withInterceptors([errorInterceptor]), withInterceptorsFromDi()),
    provideNgxMask(),
    provideSweetAlert2(),
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: ["localhost:44359"],
        }
      }),
      LoggerModule.forRoot({
        // serverLoggingUrl: '/api/log',
        level: NgxLoggerLevel.TRACE,
        // serverLogLevel: NgxLoggerLevel.DEBUG
      })
    ),
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
  ]
};
