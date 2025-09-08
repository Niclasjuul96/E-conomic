import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeDa from '@angular/common/locales/da';

registerLocaleData(localeDa);


bootstrapApplication(App, {
  providers: [
    importProvidersFrom(FormsModule),
    provideRouter([]),
    provideHttpClient(),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'da-DK' }
  ],
});
