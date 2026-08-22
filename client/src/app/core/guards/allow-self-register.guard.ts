import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { Constants } from '@core/constants';

// login.component.html already hides the "Register" link when allowSelfRegister is
// false, but that only hides the link - nothing stopped a direct visit to /register
// itself from still registering a new account.
export const allowSelfRegisterGuard: CanActivateFn = () => {
  const router: Router = inject(Router);

  if (Constants.allowSelfRegister) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
