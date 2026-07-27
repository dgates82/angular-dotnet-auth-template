import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { roleGuard } from './role.guard';
import { AccountService } from '@data/services/account.service';

describe('roleGuard', () => {
  let accountService: { isInRole: ReturnType<typeof vi.fn> };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accountService = { isInRole: vi.fn() };
    router = { createUrlTree: vi.fn().mockReturnValue({} as UrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
      ]
    });
  });

  it('allows access when the user has one of the required roles', () => {
    accountService.isInRole.mockImplementation((role: string) => role === 'Admin');

    const result = TestBed.runInInjectionContext(() => roleGuard(['Admin'])({} as unknown as ActivatedRouteSnapshot, {} as unknown as RouterStateSnapshot));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /forbidden when the user has none of the required roles', () => {
    accountService.isInRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => roleGuard(['Admin'])({} as unknown as ActivatedRouteSnapshot, {} as unknown as RouterStateSnapshot));

    expect(router.createUrlTree).toHaveBeenCalledWith(['forbidden']);
    expect(result).toBe(router.createUrlTree.mock.results[0].value);
  });

  it('allows access if the user has any of several required roles', () => {
    accountService.isInRole.mockImplementation((role: string) => role === 'Editor');

    const result = TestBed.runInInjectionContext(() => roleGuard(['Admin', 'Editor'])({} as unknown as ActivatedRouteSnapshot, {} as unknown as RouterStateSnapshot));

    expect(result).toBe(true);
  });
});
