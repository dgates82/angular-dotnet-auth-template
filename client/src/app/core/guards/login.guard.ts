import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';


@Injectable({
  providedIn: 'root'
})
export class LoginGuard  {
  private accountService = inject(AccountService);
  private logger = inject(LoggerService);
  private router = inject(Router);


  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    this.logger.trace(`login.guard.canActivate`);

    if (this.accountService.isUserAuthenticated()) {
      this.logger.trace(`login.guard.canActivate | User is already authenticated`);
      this.router.navigate(['home']);
      return false;
    }

    return true;

  }
  
}
