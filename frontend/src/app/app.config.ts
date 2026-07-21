import { ApplicationConfig, provideAppInitializer, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './services/auth.interceptor';
import { errorToastInterceptor } from './services/error-toast.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Noop is enough for ngx-toastr's enter/exit triggers and keeps the bundle lean;
    // swap to provideAnimations() if the app wants real motion elsewhere later.
    provideNoopAnimations(),
    provideToastr({ positionClass: 'toast-top-right', timeOut: 5000, preventDuplicates: true }),
    provideHttpClient(withInterceptors([authInterceptor, errorToastInterceptor])),
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
  ]
};
