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
  });
});
