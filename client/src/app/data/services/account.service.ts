import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocationStrategy } from '@angular/common';

import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { catchError, tap } from 'rxjs/operators';
import { BehaviorSubject, lastValueFrom } from 'rxjs';


import { IApplicationUser } from '@interfaces/account/application-user';
import { IAuthRequest } from '@interfaces/account/auth-request';
import { IAuthResponse } from '@interfaces/account/auth-response';

import { Constants } from '@core/constants';
import { readAuthResponse, writeAuthResponse } from '@core/auth-storage';
import { JwtHelperService } from '@auth0/angular-jwt';
import { IForgotPasswordRequest } from '@interfaces/account/forgot-password-request';
import { IResetPasswordRequest } from '@interfaces/account/reset-password-request';
import { IResponse } from '@interfaces/response';
import { IConfirmEmailRequest } from '@interfaces/account/confirm-email-request';
import { ITwoFaAuthRequest } from '@interfaces/account/two-fa-auth-request';
import { IEnableAuthenticatorResponse } from '@interfaces/account/enable-authenticator-response';
import { IEmailOnlyRequest } from '@interfaces/account/email-only-request';
import { IVerifyAuthenticatorRequest } from '@interfaces/account/verify-authenticator-request';
import { IVerifyAuthenticatorResponse } from '@interfaces/account/verify-authenticator-response';
import { IChangePasswordRequest } from '@interfaces/account/change-password-request';
import {IRegisterRequest} from "@interfaces/account/register-request";
import {ISendVerificationCodeRequest} from "@interfaces/account/send-verification-code-request";


@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly logger = inject(LoggerService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly jwtHelper = inject(JwtHelperService);


  private apiUrl = `${this.locationStrategy.getBaseHref()}api/account`

  public authChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public sendAuthStateChangeNotification(isAuthenticated: boolean) {
    this.logger.trace(`account.service.sendAuthStateChangeNotification | isAuthenticated: ${isAuthenticated}`)
    this.authChanged.next(isAuthenticated);
    // this.authChangedSubject.next(isAuthenticated);
  }

  public getAuthResponse = (): IAuthResponse | null => {
    const authResponse = readAuthResponse();
    if (!authResponse) {
      this.logger.trace(`account.service.getAuthResponse | No authResponse found in local storage`)
      return null;
    }

    this.logger.trace(`account.service.getAuthResponse | authResponse:`, authResponse)

    // HACK: Finish decoding user from token and remove user from authResponse so it is not stored in plain text in local storage
    /*
    const decodedToken = this.jwtHelper.decodeToken(authResponse.token ?? "");
    this.logger.trace(`account.service.getAuthResponse | decodedToken: ${JSON.stringify(decodedToken)}`)
    const user = decodedToken?.user as IApplicationUser;
    this.logger.trace(`account.service.getAuthResponse | user: ${JSON.stringify(user)}`);
    */

    return authResponse

  }

  // Merges a partial user update (e.g. a phone number set while enabling SMS 2FA)
  // into the cached authResponse, so getAuthResponse()/getLoggedInUser() reflect
  // it immediately instead of only after the next login.
  public updateStoredUser(partialUser: Partial<IApplicationUser>): void {
    const authResponse = this.getAuthResponse();
    if (!authResponse) {
      this.logger.trace(`account.service.updateStoredUser | No authResponse found in local storage`)
      return;
    }

    authResponse.user = { ...authResponse.user, ...partialUser };
    writeAuthResponse(authResponse);
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

    const authResponse = this.getAuthResponse();

    const token = authResponse?.token;

    return (token && !this.jwtHelper.isTokenExpired(token)) ? true : false;
  }

  async register(request: IRegisterRequest): Promise<IResponse>{
    this.logger.debug(`account.service.register | email: ${request.email}`);

    const url = `${this.apiUrl}/register`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.register | response: `, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async getUserByEmail(email: string): Promise<IApplicationUser> {
    this.logger.debug(`account.service.getUserByEmail | email: ${email}`)

    const url = `${this.apiUrl}/getuserbyemail?email=${email}`;

    return lastValueFrom(this.httpClient.get<IApplicationUser>(url).pipe(
      tap(response => this.logger.trace(`account.service.getUserByEmail | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  async login(authRequest: IAuthRequest): Promise<IAuthResponse> {
    this.logger.debug(`account.service.login | email: ${authRequest.email}`)

    const url = `${this.apiUrl}/login`;

    return lastValueFrom(this.httpClient.post<IAuthResponse>(url, authRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.login | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  async login2fa(authRequest: ITwoFaAuthRequest): Promise<IAuthResponse> {
    this.logger.debug(`account.service.login2fa | authRequest: ${JSON.stringify(authRequest)}`)

    const url = `${this.apiUrl}/login2fa`;

    return lastValueFrom(this.httpClient.post<IAuthResponse>(url, authRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.login2fa | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async sendForgotPassword(forgotPasswordRequest: IForgotPasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.sendForgotPassword`);

    const url = `${this.apiUrl}/forgotpassword`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, forgotPasswordRequest, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendForgotPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async resetPassword(request: IResetPasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.resetPassword | email: ${request.email}`);

    const url = `${this.apiUrl}/resetpassword`;
    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  async changePassword(request: IChangePasswordRequest): Promise<IResponse> {
    this.logger.debug(`account.service.changePassword | email: ${request.email}`);

    const url = `${this.apiUrl}/changepassword`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.changePassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async sendConfirmEmail(request: IEmailOnlyRequest): Promise<IResponse> {
    this.logger.debug(`account.service.sendConfirmEmail | email: ${request.email}`);

    const url = `${this.apiUrl}/sendemailconfirmation`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendConfirmEmail | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async confirmEmail(request: IConfirmEmailRequest): Promise<IResponse>{
    this.logger.debug(`account.service.confirmEmail | userId: ${request.userId}`);

    const url = `${this.apiUrl}/confirmemail`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetPassword | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async sendTwoFaCode(request: ISendVerificationCodeRequest) : Promise<IResponse> {
    this.logger.debug(`account.service.sendVerificationCode | email: ${request.email}`);

    const url = `${this.apiUrl}/SendTwoFaCode`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.sendVerificationCode | response:`, response)),
      catchError(err => this.errorService.handleError(err))));
  }

  async enableAuthenticator(request: IEmailOnlyRequest): Promise<IEnableAuthenticatorResponse> {
    this.logger.debug(`account.service.enableAuthenticator | email: ${request.email}`);

    const url = `${this.apiUrl}/enableauthenticator`;

    return lastValueFrom(this.httpClient.post<IEnableAuthenticatorResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.enableAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async verifyAuthenticator(request: IVerifyAuthenticatorRequest): Promise<IVerifyAuthenticatorResponse>{
    this.logger.debug(`account.service.verifyAuthenticator | email: ${request.email}`);

    const url = `${this.apiUrl}/verifyauthenticator`;

    return lastValueFrom(this.httpClient.post<IVerifyAuthenticatorResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.verifyAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }

  async resetAuthenticator(request: IEmailOnlyRequest): Promise<IResponse> {
    this.logger.debug(`account.service.resetAuthenticator | email: ${request.email}`);

    const url = `${this.apiUrl}/resetauthenticator`;

    return lastValueFrom(this.httpClient.post<IResponse>(url, request, Constants.postOptions).pipe(
      tap(response => this.logger.trace(`account.service.resetAuthenticator | response:`, response)),
      catchError(err => this.errorService.handleError(err))));

  }


  /**
   * Test method for testing secure endpoints
   * @returns
   */
  async testSecure() : Promise<string> {
    this.logger.debug(`account.service.testSecure`);
    const url = `${this.apiUrl}/secure`;
    // return lastValueFrom(this.httpClient.get(url, {responseType: 'text'}));
    return lastValueFrom(this.httpClient.get(url, {responseType: 'text'}));
  }

}
