import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { IAuthResponse } from '@interfaces/account/auth-response';

describe('LoginComponent', () => {
  let accountService: {
    login: ReturnType<typeof vi.fn>;
    sendAuthStateChangeNotification: ReturnType<typeof vi.fn>;
    testSecure: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accountService = {
      login: vi.fn(),
      sendAuthStateChangeNotification: vi.fn(),
      testSecure: vi.fn().mockResolvedValue(''),
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
});
