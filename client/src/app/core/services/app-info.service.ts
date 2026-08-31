import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { SKIP_ERROR_DIALOG } from '@core/interceptors/error.interceptor';
import { IAppInfo } from '@interfaces/app-info';

const DEFAULT_APP_INFO: IAppInfo = {
  demoBannerEnabled: false,
  demoBannerRepoUrl: ''
};

// A missing file (native `dotnet run`, no Docker build involved) is expected, not an error.
const silentContext = new HttpContext().set(SKIP_ERROR_DIALOG, true);

// app-info.json is a static file baked in at Docker build time - see the Dockerfile.
@Injectable({
  providedIn: 'root'
})
export class AppInfoService {
  private readonly http = inject(HttpClient);

  private readonly appInfo$: Observable<IAppInfo> = this.http.get<IAppInfo>('/app-info.json', { context: silentContext }).pipe(
    catchError(() => of(DEFAULT_APP_INFO)),
    shareReplay(1)
  );

  public get(): Observable<IAppInfo> {
    return this.appInfo$;
  }
}
