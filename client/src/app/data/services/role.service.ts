import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly logger = inject(LoggerService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly httpClient = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);

  private apiUrl = `${this.locationStrategy.getBaseHref()}api/admin/roles`;

  // Backed by RoleManager, not a hardcoded list - what's assignable always matches
  // what actually exists in the database.
  public get(): Promise<string[]> {
    this.logger.debug(`role.service.get`);

    return lastValueFrom(this.httpClient.get<string[]>(this.apiUrl).pipe(
      tap(response => this.logger.trace(`role.service.get | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }
}
