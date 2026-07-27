import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { LoginGuard } from './login.guard';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let accountService: { isUserAuthenticated: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accountService = { isUserAuthenticated: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });

    guard = TestBed.inject(LoginGuard);
  });

  it('allows navigation to login/register pages when the user is not authenticated', () => {
    accountService.isUserAuthenticated.mockReturnValue(false);

    const result = guard.canActivate();

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects an already-authenticated user to home instead', () => {
    accountService.isUserAuthenticated.mockReturnValue(true);

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['home']);
  });
});
