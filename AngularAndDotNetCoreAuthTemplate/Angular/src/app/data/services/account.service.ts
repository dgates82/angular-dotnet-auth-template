import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';


import { IApplicationUser } from '@interfaces/account/application-user';
import { IAuthRequest } from '@interfaces/account/auth-request';
import { IAuthResponse } from '@interfaces/account/auth-response';

import { Constants } from '@core/constants';
import { JwtHelperService } from '@auth0/angular-jwt';
import { IForgotPasswordRequest } from '@interfaces/account/forgot-password-request';
import { IResetPasswordRequest } from '@interfaces/account/reset-password-request';
import { IResponse } from '@interfaces/response';
import { IConfirmEmailRequest } from '@interfaces/account/confirm-email-request';
import { ITwoFaAuthRequest } from '@interfaces/account/two-fa-auth-request';
import { IEnableAuthenticatorResponse } from '@interfaces/account/enable-authenticator-response';
import { IEnableAuthenticatorRequest } from '@interfaces/account/enable-authenticator-request';
import { IVerifyAuthenticatorRequest } from '@interfaces/account/verify-authenticator-request';
import { IVerifyAuthenticatorResponse } from '@interfaces/account/verify-authenticator-response';
import { IChangePasswordRequest } from '@interfaces/account/change-password-request';
import { ISendEmailConfirmRequest } from '@interfaces/account/send-email-confirm-request';
import {IRegisterRequest} from "@interfaces/account/register-request";
import {ISendVerificationCodeRequest} from "@interfaces/account/send-verification-code-request";
import {CanActivateFn} from "@angular/router";


@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private readonly logger: LoggerService,
              private readonly httpClient: HttpClient,
              private readonly errorService: HttpErrorService,
              private readonly locationStrategy: LocationStrategy,
              private readonly jwtHelper: JwtHelperService) { }

  private apiUrl: string = `${this.locationStrategy.getBaseHref()}api/account`

  public authChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public sendAuthStateChangeNotification(isAuthenticated: boolean) {
    this.logger.trace(`account.service.sendAuthStateChangeNotification | isAuthenticated: ${isAuthenticated}`)
    this.authChanged.next(isAuthenticated);
    // this.authChangedSubject.next(isAuthenticated);
  }

  public getAuthResponse = (): IAuthResponse | null => {
    const response = localStorage.getItem('authResponse');
    if (!response) {
      this.logger.trace(`account.service.getAuthResponse | No authResponse found in local storage`)
      return null;
    }

    this.logger.trace(`account.service.getAuthResponse | authResponse: ${response}`)
    const authResponse = JSON.parse(response) as IAuthResponse;

    // HACK: Finish decoding user from token and remove user from authResponse so it is not stored in plain text in local storage
    /*
    const decodedToken = this.jwtHelper.decodeToken(authResponse.token ?? "");
    this.logger.trace(`account.service.getAuthResponse | decodedToken: ${JSON.stringify(decodedToken)}`)
    const user = decodedToken?.user as IApplicationUser;
    this.logger.trace(`account.service.getAuthResponse | user: ${JSON.stringify(user)}`);
    */

    return authResponse

  }

  public getLoggedInUser(): IApplicationUser | null{
    this.logger.debug(`account.service.getLoggedInUser`);
    const authResponse = this.getAuthResponse();
    const user = authResponse?.user ?? null

    this.logger.trace(`account.service.getLoggedInUser | user:`, user);

    return user;
  }

  // IsInRole method that takes a role as a parameter and returns a boolean
  public isInRole = (role: string): boolean => {
    this.logger.trace(`account.service.isInRole | role: ${role}`);
    const authResponse = this.getAuthResponse();

    this.logger.trace(`account.service.isInRole | user.Roles: `, authResponse?.user?.roles);
    return authResponse?.user?.roles?.includes(role) ?? false;
  }

  public isUserAuthenticated = (): boolean => {

    var authResponse = this.getAuthResponse();

    const token = authResponse?.token;

    return (token && !this.jwtHelper.isTokenExpired(token)) ? true : false;
  }

  async register(request: IRegisterRequest): Promise<IResponse>{
    this.logger.debug(`account.service.register | email: ${request.email}`);

    let url = `${this.apiUrl}/register`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.register | response: `, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async getUserByEmail(email: string): Promise<IApplicationUser> {
    this.logger.debug(`account.service.getUserByEmail | email: ${email}`)

    let url = `${this.apiUrl}/getuserbyemail?email=${email}`;

    return this.httpClient.get<IApplicationUser>(url).pipe(
      tap(response => this.logger.trace(`account.service.getUserByEmail | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

  async login(authRequest: IAuthRequest): Promise<IAuthResponse> {
    this.logger.debug(`account.service.login | email: ${authRequest.email}`)

    let url = `${this.apiUrl}/login`;

    return this.httpClient.post<IAuthResponse>(url, authRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.login | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

  async login2fa(authRequest: ITwoFaAuthRequest): Promise<IAuthResponse> {
    this.logger.debug(`account.service.login2fa | authRequest: ${JSON.stringify(authRequest)}`)

    let url = `${this.apiUrl}/login2fa`;

    return this.httpClient.post<IAuthResponse>(url, authRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.login2fa | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async sendForgotPassword(forgotPasswordRequest: IForgotPasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.sendForgotPassword`);

    let url = `${this.apiUrl}/forgotpassword`;

    return this.httpClient.post<IResponse>(url, forgotPasswordRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendForgotPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async resetPassword(request: IResetPasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.resetPassword | email: ${request.email}`);

    let url = `${this.apiUrl}/resetpassword`;
    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

  async changePassword(request: IChangePasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.changePassword | email: ${request.email}`);

    let url = `${this.apiUrl}/changepassword`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.changePassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async sendConfirmEmail(request: ISendEmailConfirmRequest): Promise<IResponse> {
    this.logger.debug(`account.service.sendConfirmEmail | email: ${request.email}`);

    let url = `${this.apiUrl}/sendemailconfirmation`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendConfirmEmail | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async confirmEmail(request: IConfirmEmailRequest): Promise<IResponse>{
    this.logger.debug(`account.service.confirmEmail | userId: ${request.userId}`);

    let url = `${this.apiUrl}/confirmemail`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async sendTwoFaCode(request: ISendVerificationCodeRequest) : Promise<IResponse> {
    this.logger.debug(`account.service.sendVerificationCode | email: ${request.email}`);

    let url = `${this.apiUrl}/SendTwoFaCode`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendVerificationCode | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();
  }

  async enableAuthenticator(request: IEnableAuthenticatorRequest): Promise<IEnableAuthenticatorResponse> {
    this.logger.debug(`account.service.enableAuthenticator | email: ${request.email}`);

    let url = `${this.apiUrl}/enableauthenticator`;

    return this.httpClient.post<IEnableAuthenticatorResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.enableAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async verifyAuthenticator(request: IVerifyAuthenticatorRequest): Promise<IVerifyAuthenticatorResponse>{
    this.logger.debug(`account.service.verifyAuthenticator | email: ${request.email}`);

    let url = `${this.apiUrl}/verifyauthenticator`;

    return this.httpClient.post<IVerifyAuthenticatorResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.verifyAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }

  async resetAuthenticator(request: IEnableAuthenticatorRequest): Promise<IResponse> {
    this.logger.debug(`account.service.resetAuthenticator | email: ${request.email}`);

    let url = `${this.apiUrl}/resetauthenticator`;

    return this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))).toPromise();

  }


  /**
   * Test method for testing secure endpoints
   * @returns
   */
  async testSecure() : Promise<any> {
    this.logger.debug(`account.service.testSecure`);
    let url = `${this.apiUrl}/secure`;
    // return this.httpClient.get(url, {responseType: 'text'}).toPromise();
    return this.httpClient.get(url, {responseType: 'text'}).toPromise();
  }

}
