import { Injectable, inject } from '@angular/core';

import { HttpClient, HttpContext } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { IApplicationUser } from '@interfaces/account/application-user';
import { Constants } from '@core/constants';
import {IResponse} from "@interfaces/response";
import { SKIP_ERROR_DIALOG } from '@core/interceptors/error.interceptor';

// getById/createUser/deactivate/activate/unlock show their own error feedback; get()/update() don't.
const silentContext = new HttpContext().set(SKIP_ERROR_DIALOG, true);

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly logger = inject(LoggerService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly httpClient = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);


  private apiUrl = `${this.locationStrategy.getBaseHref()}api/admin/user`

  public get(): Promise<IApplicationUser[]> {
    this.logger.debug(`user.service.get`);

    return lastValueFrom(this.httpClient.get<IApplicationUser[]>(`${this.apiUrl}`).pipe(
      tap(response => this.logger.trace(`user.service.get | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public getById(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.getbyId | id: ${id}`);

    const url = `${this.apiUrl}/get?id=${id}`;

    this.logger.debug(`user.service.getbyId | url: ${url}`);

    return lastValueFrom(this.httpClient.get<IApplicationUser>(url, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.getById | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public createUser(request: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.createUser | request: ${JSON.stringify(request)}`);

    return lastValueFrom(this.httpClient.post<IApplicationUser>(this.apiUrl, request, { ...Constants.postOptions, context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.createUser | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  public update(user: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.update | user: ${JSON.stringify(user)}`);

    return lastValueFrom(this.httpClient.put<IApplicationUser>(`${this.apiUrl}`, user).pipe(
      tap(response => this.logger.trace(`user.service.update | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public deactivate(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.deactivate | id: ${id}`);

    const url = `${this.apiUrl}/deactivate?id=${id}`;

    return lastValueFrom(this.httpClient.post<IApplicationUser>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.deactivate | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public activate(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.activate | id: ${id}`);

    const url = `${this.apiUrl}/activate?id=${id}`;

    return lastValueFrom(this.httpClient.post<IApplicationUser>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.activate | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  public unlock(id: string): Promise<IResponse> {
    this.logger.debug(`user.service.unlock | id: ${id}`);

    const url = `${this.apiUrl}/unlock?id=${id}`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, null, { context: silentContext }).pipe(
      tap(response => this.logger.trace(`user.service.unlock | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

}
