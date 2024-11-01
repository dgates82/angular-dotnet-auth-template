import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { IApplicationUser } from '@interfaces/account/application-user';
import { Constants } from '@core/constants';
import {IResponse} from "@interfaces/response";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private readonly logger: LoggerService,
              private readonly locationStrategy: LocationStrategy,
              private readonly httpClient: HttpClient,
              private readonly errorService: HttpErrorService) { }

  private apiUrl: string = `${this.locationStrategy.getBaseHref()}api/admin/user`

  public get(): Promise<IApplicationUser[]> {
    this.logger.debug(`user.service.get`);

    return this.httpClient.get<IApplicationUser[]>(`${this.apiUrl}`).pipe(
      tap(response => this.logger.trace(`user.service.get | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  public getById(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.getbyId | id: ${id}`);

    const url = `${this.apiUrl}/get?id=${id}`;

    this.logger.debug(`user.service.getbyId | url: ${url}`);

    return this.httpClient.get<IApplicationUser>(url).pipe(
      tap(response => this.logger.trace(`user.service.getById | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  public createUser(request: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.createUser | request: ${JSON.stringify(request)}`);

    return this.httpClient.post<IApplicationUser>(this.apiUrl, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`user.service.createUser | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

  public update(user: IApplicationUser): Promise<IApplicationUser> {
    this.logger.debug(`user.service.update | user: ${JSON.stringify(user)}`);

    return this.httpClient.put<IApplicationUser>(`${this.apiUrl}`, user).pipe(
      tap(response => this.logger.trace(`user.service.update | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  public deactivate(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.deactivate | id: ${id}`);

    const url = `${this.apiUrl}/deactivate?id=${id}`;

    return this.httpClient.post<IApplicationUser>(url, null).pipe(
      tap(response => this.logger.trace(`user.service.deactivate | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  public activate(id: string): Promise<IApplicationUser> {
    this.logger.debug(`user.service.activate | id: ${id}`);

    const url = `${this.apiUrl}/activate?id=${id}`;

    return this.httpClient.post<IApplicationUser>(url, null).pipe(
      tap(response => this.logger.trace(`user.service.activate | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  public unlock(id: string): Promise<IResponse> {
    this.logger.debug(`user.service.unlock | id: ${id}`);

    const url = `${this.apiUrl}/unlock?id=${id}`;

    return this.httpClient.post<IResponse>(url, null).pipe(
      tap(response => this.logger.trace(`user.service.unlock | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

}
