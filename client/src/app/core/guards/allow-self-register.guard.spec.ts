import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { Constants } from '@core/constants';
import { allowSelfRegisterGuard } from './allow-self-register.guard';

describe('allowSelfRegisterGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let originalAllowSelfRegister: boolean;

  beforeEach(() => {
    originalAllowSelfRegister = Constants.allowSelfRegister;
    router = { createUrlTree: vi.fn().mockReturnValue({} as UrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
      ]
    });
  });

  afterEach(() => {
    Constants.allowSelfRegister = originalAllowSelfRegister;
  });

  it('allows access when self-registration is allowed', () => {
    Constants.allowSelfRegister = true;

    const result = TestBed.runInInjectionContext(() => allowSelfRegisterGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /login when self-registration is disallowed', () => {
    Constants.allowSelfRegister = false;

    const result = TestBed.runInInjectionContext(() => allowSelfRegisterGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(router.createUrlTree.mock.results[0].value);
  });
});
