import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';

bootstrapApplication(App, {
  providers: [
    importProvidersFrom(FormsModule),
    provideRouter([]),
    provideHttpClient(),
    provideAnimations()
  ],
});
