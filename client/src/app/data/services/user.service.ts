import { Injectable, inject } from '@angular/core';

import { HttpClient, HttpContext } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IPagedResult } from '@interfaces/admin/paged-result';
import { Constants } from '@core/constants';
import {IResponse} from "@interfaces/response";
import { SKIP_ERROR_DIALOG } from '@core/interceptors/error.interceptor';

// getById/createUser/deactivate/activate/unlock show their own error feedback; get()/update() don't.
const silentContext = new HttpContext().set(SKIP_ERROR_DIALOG, true);

// The admin user-management endpoints (list/get/create/activate/deactivate/unlock) are
// served directly by DGates.Identity.Jwt2Fa under api/auth; only update() still hits this
// app's own api/admin/user, since profile fields (name/phone/address) are app-specific
// and the package can't know about them.
const jwt2FaAdminUrlSegment = 'api/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly logger = inject(LoggerService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly httpClient = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);


  private apiUrl = `${this.locationStrategy.getBaseHref()}${jwt2FaAdminUrlSegment}`
  private localApiUrl = `${this.locationStrategy.getBaseHref()}api/admin/user`

  public async get(): Promise<IApplicationUser[]> {
    this.logger.debug(`user.service.get`);

    // No pagination UI yet, but listusers is itself server-paginated (and clamps
    // pageSize to its own MaxPageSize) - page through every result here rather than
    // assuming everyone fits in one call, so this stays correct as a real deployment's
    // user count grows past whatever a template happens to seed.
    const items: IApplicationUser[] = [];
    let page = 1;
    let pageSize = 1000;

    for (;;) {
      const url = `${this.apiUrl}/listusers?page=${page}&pageSize=${pageSize}`;
      const response = await lastValueFrom(this.httpClient.get<IPagedResult<IApplicationUser>>(url).pipe(
        tap(r => this.logger.trace(`user.service.get | page ${page}:`, r)),
        catchError(err => this.errorService.handleError(err))));

      items.push(...response.items);

      if (items.length >= response.totalCount || response.items.length === 0) {
        return items;
      }

      pageSize = response.pageSize;
      page++;
    }
  }

  public getById(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.getbyId | id: ${id}`);

    const url = `${this.apiUrl}/getuserbyid/${id}`;

    this.logger.debug(`user.service.getbyId | url: ${url}`);

    return lastValueFrom(this.httpClient.get<IApplicationUser>(url, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.getById | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public async createUser(request: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.createUser | request: ${JSON.stringify(request)}`);

    // admincreateuser only knows email/roles (and already sends the first-login email
    // atomically, so no separate sendConfirmEmail call is needed afterward). Profile
    // fields, if any were filled in, are set with a follow-up call to update() -
    // the same local endpoint the edit-user screen uses.
    const url = `${this.apiUrl}/admincreateuser`;
    const created = await lastValueFrom(this.httpClient.post<IApplicationUser>(url,
      { email: request.email, roles: request.roles },
      { ...Constants.postOptions, context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.createUser | created:`, response)),
      catchError(err => this.errorService.handleError(err))));

    const hasProfileFields = request.firstName || request.lastName || request.phoneNumber
      || request.streetAddress || request.city || request.zipCode || request.state;
    if (!hasProfileFields) {
      return created;
    }

    return this.update({ ...request, id: created.id });
  }

  public update(user: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.update | user: ${JSON.stringify(user)}`);

    return lastValueFrom(this.httpClient.put<IApplicationUser>(`${this.localApiUrl}`, user).pipe(
      tap(response => this.logger.trace(`user.service.update | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public deactivate(id: string): Promise<IResponse> {
    this.logger.debug(`user.service.deactivate | id: ${id}`);

    const url = `${this.apiUrl}/deactivate/${id}`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.deactivate | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public activate(id: string): Promise<IResponse> {
    this.logger.debug(`user.service.activate | id: ${id}`);

    const url = `${this.apiUrl}/activate/${id}`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.activate | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public unlock(id: string): Promise<IResponse> {
    this.logger.debug(`user.service.unlock | id: ${id}`);

    const url = `${this.apiUrl}/unlock/${id}`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.unlock | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

}
