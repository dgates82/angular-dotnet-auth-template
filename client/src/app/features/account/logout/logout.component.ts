import { Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { MatCard, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
    styleUrls: ['./logout.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardSubtitle, MatCardContent, MatButton]
})
export class LogoutComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);


  ngOnInit(): void {
    this.logger.debug(`logout.component.ngOnInit`);
  }

  cancel() {
    // Return user to previous page
    this.logger.debug(`logout.component.cancel`);
    this.location.back();
  }

  logout() {
    this.logger.info(`User logging out`);
    // Logout and send user to login page
    localStorage.removeItem('authResponse');
    this.accountService.sendAuthStateChangeNotification(false);
    this.router.navigate(["login"]);

  }


}
