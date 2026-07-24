import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor(private accountService: AccountService,
    private logger: LoggerService,
    private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    this.logger.trace(`auth.guard.canActivate`);

    if (this.accountService.isUserAuthenticated()) {

      return true;
    }

    this.logger.trace(`auth.guard.canActivate | User is not authenticated`);

    this.logger.trace(`auth.guard.canActivate | returnUrl: ${state.url}`)

    this.router.navigate(['login'], { queryParams: { returnUrl: state.url } });

    return false;
  }

}
