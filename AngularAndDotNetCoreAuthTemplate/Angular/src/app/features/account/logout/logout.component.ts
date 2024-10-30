import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly location: Location,
              private readonly router: Router,
              private readonly accountService: AccountService) { }

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
