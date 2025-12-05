import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
