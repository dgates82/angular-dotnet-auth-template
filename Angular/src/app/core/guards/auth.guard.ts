import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private accountService: AccountService,
    private logger: LoggerService,
    private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    this.logger.trace(`auth.guard.canActivate`);

    if (this.accountService.isUserAuthenticated()) {

      const authResponse = this.accountService.getAuthResponse();

      if (route.data.expectedRole === "Admin" && !authResponse?.user.isAdmin) {
        // TODO: Redirect to unauthorized page
      }

      return true;
    }

    this.logger.trace(`auth.guard.canActivate | User is not authenticated`);

    this.logger.trace(`auth.guard.canActivate | returnUrl: ${state.url}`)
    
    this.router.navigate(['login'], { queryParams: { returnUrl: state.url } });

    return false;
  }
  
}
