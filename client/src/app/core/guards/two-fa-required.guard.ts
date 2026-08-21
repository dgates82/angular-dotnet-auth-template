import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';

// Blocks navigation anywhere but /enable2fa when the app requires 2FA and the
// current user hasn't got it configured - login.component.ts's onLoginResponse()
// already redirects here right after login, but without a guard nothing stops the
// user from just clicking elsewhere in the sidenav afterward.
export const twoFaRequiredGuard: CanActivateFn = () => {
  const accountService: AccountService = inject(AccountService);
  const router: Router = inject(Router);

  if (!Constants.is2FaRequired) {
    return true;
  }

  const user = accountService.getLoggedInUser();
  if (!user || user.twoFactorEnabled) {
    return true;
  }

  return router.createUrlTree(['/enable2fa', user.email]);
};
