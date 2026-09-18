import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { TwoFaNudgeService } from '@core/services/two-fa-nudge.service';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { Constants } from '@core/constants';

describe('LoginComponent', () => {
  let accountService: {
    login: ReturnType<typeof vi.fn>;
    sendAuthStateChangeNotification: ReturnType<typeof vi.fn>;
    testSecure: ReturnType<typeof vi.fn>;
    sendTwoFaCode: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accountService = {
      login: vi.fn(),
      sendAuthStateChangeNotification: vi.fn(),
      testSecure: vi.fn().mockResolvedValue(''),
      sendTwoFaCode: vi.fn().mockResolvedValue({ isSuccess: true }),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not attempt to log in while the form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.login();

    expect(accountService.login).not.toHaveBeenCalled();
  });

  it('logs in and redirects on a successful, non-2FA response', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const authResponse = {
      isAuthSuccessful: true,
      requiresTwoFactor: false,
    } as IAuthResponse;
    accountService.login.mockResolvedValue(authResponse);

    fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
    fixture.componentInstance.login();

    // Flush the login().then(onLoginResponse) microtask chain.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(accountService.sendAuthStateChangeNotification).toHaveBeenCalledWith(true);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('redirects to /enable2fa instead of the return url when 2FA is required but not configured', async () => {
    const originalIs2FaRequired = Constants.is2FaRequired;
    Constants.is2FaRequired = true;
    try {
      // is2FaRequired is read via a property initializer, so it must be set before
      // the component (and its constructor) is created.
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();

      const authResponse = {
        isAuthSuccessful: true,
        requiresTwoFactor: false,
      } as IAuthResponse;
      accountService.login.mockResolvedValue(authResponse);

      fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
      fixture.componentInstance.login();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // The session still has to be written before the redirect - /enable2fa needs
      // an authenticated caller to actually enroll a method.
      expect(accountService.sendAuthStateChangeNotification).toHaveBeenCalledWith(true);
      expect(router.navigate).toHaveBeenCalledWith(['/enable2fa', 'admin@example.com']);
    } finally {
      Constants.is2FaRequired = originalIs2FaRequired;
    }
  });

  it('shows an invalid-login message when the credentials are rejected', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    accountService.login.mockRejectedValue(new Error('Unauthorized'));

    fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'wrong' });
    fixture.componentInstance.login();

    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.isInvalidLogin).toBe(true);
    expect(fixture.componentInstance.isSubmitting).toBe(false);
  });

  it('calls testSecure and notifies the 2FA nudge service on a successful, non-2FA response', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const nudgeService = TestBed.inject(TwoFaNudgeService);
    const notifySpy = vi.spyOn(nudgeService, 'notifyLoginSuccess');

    const authResponse = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
    accountService.login.mockResolvedValue(authResponse);

    fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
    fixture.componentInstance.login();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(notifySpy).toHaveBeenCalledWith(false);
    expect(accountService.testSecure).toHaveBeenCalled();
  });

  it('shows the failed-login message when the response is neither successful nor 2FA-required', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const authResponse = { isAuthSuccessful: false, requiresTwoFactor: false, errorMessage: 'Account locked' } as IAuthResponse;
    accountService.login.mockResolvedValue(authResponse);

    fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'wrong' });
    fixture.componentInstance.login();

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.isInvalidLogin).toBe(true);
    expect(fixture.componentInstance.isSubmitting).toBe(false);
    expect(fixture.componentInstance.errorMessage).toBe('Account locked');
    expect(accountService.sendAuthStateChangeNotification).toHaveBeenCalledWith(false);
  });

  describe('when 2FA is required', () => {
    it('sends a code to email and sets the obfuscated-email subtitle', async () => {
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();

      const authResponse = { isAuthSuccessful: false, requiresTwoFactor: true, twoFactorMethod: 'Email' } as IAuthResponse;
      accountService.login.mockResolvedValue(authResponse);

      fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
      fixture.componentInstance.login();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'admin@example.com', method: 'Email' });
      expect(fixture.componentInstance.is2FaEnabled).toBe(true);
      expect(fixture.componentInstance.subtitle).toContain('ad***@example.com');
    });

    it('sends a code to phone and sets the obfuscated-phone subtitle', async () => {
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();

      const authResponse = {
        isAuthSuccessful: false, requiresTwoFactor: true, twoFactorMethod: 'Phone', phoneNumber: '5551234567'
      } as IAuthResponse;
      accountService.login.mockResolvedValue(authResponse);

      fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
      fixture.componentInstance.login();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'admin@example.com', phoneNumber: '5551234567', method: 'Sms' });
      expect(fixture.componentInstance.is2FaEnabled).toBe(true);
      expect(fixture.componentInstance.subtitle).toContain('***-***-4567');
    });

    it('does not send a code for the authenticator method', async () => {
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();

      const authResponse = { isAuthSuccessful: false, requiresTwoFactor: true, twoFactorMethod: 'Authenticator' } as IAuthResponse;
      accountService.login.mockResolvedValue(authResponse);

      fixture.componentInstance.loginForm.setValue({ email: 'admin@example.com', password: 'Password1!' });
      fixture.componentInstance.login();

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.sendTwoFaCode).not.toHaveBeenCalled();
      expect(fixture.componentInstance.is2FaEnabled).toBe(true);
      expect(fixture.componentInstance.subtitle).toContain('authenticator app');
    });
  });
});
