import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LocationStrategy } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';

import { AccountService } from './account.service';
import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { IAuthRequest } from '@interfaces/account/auth-request';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { IRegisterRequest } from '@interfaces/account/register-request';
import { IApplicationUser } from '@interfaces/account/application-user';
import { ITwoFaAuthRequest } from '@interfaces/account/two-fa-auth-request';
import { ISendVerificationCodeRequest } from '@interfaces/account/send-verification-code-request';
import { IVerifyAuthenticatorRequest } from '@interfaces/account/verify-authenticator-request';
import { IEmailOnlyRequest } from '@interfaces/account/email-only-request';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;
  let jwtHelper: { isTokenExpired: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    jwtHelper = { isTokenExpired: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AccountService,
        HttpErrorService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocationStrategy, useValue: { getBaseHref: () => '/' } },
        { provide: JwtHelperService, useValue: jwtHelper },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('isUserAuthenticated', () => {
    it('returns false when there is no stored auth response', () => {
      expect(service.isUserAuthenticated()).toBe(false);
    });

    it('returns true when the stored token has not expired', () => {
      localStorage.setItem('authResponse', JSON.stringify({ token: 'abc' }));
      jwtHelper.isTokenExpired.mockReturnValue(false);

      expect(service.isUserAuthenticated()).toBe(true);
    });

    it('returns false when the stored token has expired', () => {
      localStorage.setItem('authResponse', JSON.stringify({ token: 'abc' }));
      jwtHelper.isTokenExpired.mockReturnValue(true);

      expect(service.isUserAuthenticated()).toBe(false);
    });
  });

  describe('isInRole', () => {
    it('returns true when the stored user has the given role', () => {
      localStorage.setItem('authResponse', JSON.stringify({ user: { roles: ['Admin'] } }));

      expect(service.isInRole('Admin')).toBe(true);
    });

    it('returns false when the stored user does not have the given role', () => {
      localStorage.setItem('authResponse', JSON.stringify({ user: { roles: ['User'] } }));

      expect(service.isInRole('Admin')).toBe(false);
    });
  });

  describe('register', () => {
    it('posts the request and resolves with the response body', async () => {
      const request: IRegisterRequest = { email: 'new@example.com', password: 'Password1!' };
      const promise = service.register(request);

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ isSuccess: true });

      await expect(promise).resolves.toEqual({ isSuccess: true });
    });
  });

  describe('login', () => {
    it('posts credentials and resolves with the auth response', async () => {
      const authRequest: IAuthRequest = { email: 'admin@example.com', password: 'Password1!' };
      const authResponse = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
      const promise = service.login(authRequest);

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(authRequest);
      req.flush(authResponse);

      await expect(promise).resolves.toEqual(authResponse);
    });

    it('rejects when the server returns an error response', async () => {
      const authRequest: IAuthRequest = { email: 'admin@example.com', password: 'wrong' };
      const promise = service.login(authRequest);

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('login2fa', () => {
    it('posts the 2FA request and resolves with the auth response', async () => {
      const request: ITwoFaAuthRequest = { email: 'admin@example.com', twoFactorProvider: 'Email', twoFactorCode: '123456' };
      const authResponse = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
      const promise = service.login2fa(request);

      const req = httpMock.expectOne('/api/auth/login2fa');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(authResponse);

      await expect(promise).resolves.toEqual(authResponse);
    });
  });

  describe('getUserByEmail', () => {
    it('gets the user by email', async () => {
      const user = { id: '1', email: 'admin@example.com' } as IApplicationUser;
      const promise = service.getUserByEmail('admin@example.com');

      const req = httpMock.expectOne('/api/auth/getuserbyemail?email=admin@example.com');
      expect(req.request.method).toBe('GET');
      req.flush(user);

      await expect(promise).resolves.toEqual(user);
    });
  });

  describe('sendTwoFaCode', () => {
    it('posts the send-code request and resolves with the response', async () => {
      const request: ISendVerificationCodeRequest = { email: 'admin@example.com', method: 'Sms', phoneNumber: '5551234567' };
      const promise = service.sendTwoFaCode(request);

      const req = httpMock.expectOne('/api/auth/SendTwoFaCode');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ isSuccess: true });

      await expect(promise).resolves.toEqual({ isSuccess: true });
    });
  });

  describe('verifyAuthenticator', () => {
    it('posts the verify request and resolves with the response', async () => {
      const request: IVerifyAuthenticatorRequest = { email: 'admin@example.com', method: 'Sms', code: '123456' };
      const response = { isSuccess: true };
      const promise = service.verifyAuthenticator(request);

      const req = httpMock.expectOne('/api/auth/verifyauthenticator');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(response);

      await expect(promise).resolves.toEqual(response);
    });
  });

  describe('resetAuthenticator', () => {
    it('posts the reset request and resolves with the response', async () => {
      const request: IEmailOnlyRequest = { email: 'admin@example.com' };
      const promise = service.resetAuthenticator(request);

      const req = httpMock.expectOne('/api/auth/resetauthenticator');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ isSuccess: true });

      await expect(promise).resolves.toEqual({ isSuccess: true });
    });
  });

  describe('updateStoredUser', () => {
    it('does nothing when there is no stored auth response', () => {
      service.updateStoredUser({ firstName: 'Updated' });

      expect(localStorage.getItem('authResponse')).toBeNull();
    });

    it('merges the partial user into the stored auth response', () => {
      const authResponse: IAuthResponse = {
        isAuthSuccessful: true,
        requiresTwoFactor: false,
        user: { id: '1', email: 'admin@example.com', firstName: 'Original', lastName: 'Name' } as IApplicationUser
      };
      localStorage.setItem('authResponse', JSON.stringify(authResponse));

      service.updateStoredUser({ firstName: 'Updated' });

      const stored = JSON.parse(localStorage.getItem('authResponse')!) as IAuthResponse;
      expect(stored.user.firstName).toBe('Updated');
      expect(stored.user.lastName).toBe('Name');
    });
  });

  describe('getLoggedInUser', () => {
    it('returns null when there is no stored auth response', () => {
      expect(service.getLoggedInUser()).toBeNull();
    });

    it('returns the stored user when an auth response exists', () => {
      const user = { id: '1', email: 'admin@example.com' } as IApplicationUser;
      localStorage.setItem('authResponse', JSON.stringify({ isAuthSuccessful: true, requiresTwoFactor: false, user }));

      expect(service.getLoggedInUser()).toEqual(user);
    });
  });
});
