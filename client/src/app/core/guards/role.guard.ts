import {CanActivateFn, Router} from '@angular/router';
import {AccountService} from "@data/services/account.service";
import {inject} from "@angular/core";

export function roleGuard(roles: string[])
  : CanActivateFn {
  return () => {
    const accountService: AccountService = inject(AccountService);
    const router: Router = inject(Router);

    // For each role in the roles array, check if the user has that role. return true if any does
    for (const role of roles) {
      if (accountService.isInRole(role)) {
        return true;
      }
    }

    return router.createUrlTree(['forbidden']);
  };
}
