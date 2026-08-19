import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';
import { twoFaRequiredGuard } from './two-fa-required.guard';

describe('twoFaRequiredGuard', () => {
  let accountService: { getLoggedInUser: ReturnType<typeof vi.fn> };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let originalIs2FaRequired: boolean;

  beforeEach(() => {
    originalIs2FaRequired = Constants.is2FaRequired;
    accountService = { getLoggedInUser: vi.fn() };
    router = { createUrlTree: vi.fn().mockReturnValue({} as UrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
      ]
    });
  });

  afterEach(() => {
    Constants.is2FaRequired = originalIs2FaRequired;
  });

  it('allows access when 2FA is not required, regardless of the user\'s 2FA state', () => {
    Constants.is2FaRequired = false;
    accountService.getLoggedInUser.mockReturnValue({ email: 'admin@example.com', twoFactorEnabled: false });

    const result = TestBed.runInInjectionContext(() => twoFaRequiredGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows access when the user already has 2FA enabled', () => {
    Constants.is2FaRequired = true;
    accountService.getLoggedInUser.mockReturnValue({ email: 'admin@example.com', twoFactorEnabled: true });

    const result = TestBed.runInInjectionContext(() => twoFaRequiredGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /enable2fa/:email when 2FA is required but not configured', () => {
    Constants.is2FaRequired = true;
    accountService.getLoggedInUser.mockReturnValue({ email: 'admin@example.com', twoFactorEnabled: false });

    const result = TestBed.runInInjectionContext(() => twoFaRequiredGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/enable2fa', 'admin@example.com']);
    expect(result).toBe(router.createUrlTree.mock.results[0].value);
  });

  it('allows access when there is no logged-in user (AuthGuard handles that case)', () => {
    Constants.is2FaRequired = true;
    accountService.getLoggedInUser.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => twoFaRequiredGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
