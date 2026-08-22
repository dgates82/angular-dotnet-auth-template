import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => {
    console.error(err);

    // Plain inline styles - Angular never mounted, so no component/Material styling exists yet.
    const root = document.querySelector('app-root');
    if (root) {
      root.innerHTML = `
        <div style="font-family: sans-serif; max-width: 640px; margin: 4rem auto; padding: 1.5rem; border: 1px solid #d32f2f; border-radius: 4px; color: #d32f2f;">
          <h1 style="margin-top: 0; font-size: 1.25rem;">Application failed to start</h1>
          <p style="white-space: pre-wrap; color: #333;"></p>
        </div>
      `;
      // textContent, not interpolated into innerHTML above - err isn't always ours.
      root.querySelector('p')!.textContent = err instanceof Error ? err.message : String(err);
    }
  });
