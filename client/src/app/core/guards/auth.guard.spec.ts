import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let accountService: { isUserAuthenticated: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accountService = { isUserAuthenticated: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('allows navigation when the user is authenticated', () => {
    accountService.isUserAuthenticated.mockReturnValue(true);

    const result = guard.canActivate(
      {} as unknown as ActivatedRouteSnapshot,
      { url: '/home' } as unknown as RouterStateSnapshot);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to login with a returnUrl when the user is not authenticated', () => {
    accountService.isUserAuthenticated.mockReturnValue(false);

    const result = guard.canActivate(
      {} as unknown as ActivatedRouteSnapshot,
      { url: '/admin/users' } as unknown as RouterStateSnapshot);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['login'], { queryParams: { returnUrl: '/admin/users' } });
  });
});
