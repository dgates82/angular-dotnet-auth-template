import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private accountService: AccountService,
    private logger: LoggerService,
    private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const isUserAdmin = this.accountService.isUserAdmin();        

    if (!isUserAdmin) {
      this.logger.trace(`admin.guard.canActivate | User is not an admin`);

      // Redirect to unauthorized page
      this.router.navigate(['forbidden']);
      
      return false;
    }

    return true;
  }
  
}
