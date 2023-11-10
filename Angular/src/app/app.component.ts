import { Component, OnInit, ViewChild } from '@angular/core';

import { faHome, faFileAlt, faUsers, faChartBar, faUser, faChevronLeft, faChevronRight, faTable, faHandshake, faSearch, faUserTie, faCalendar, faPowerOff } from '@fortawesome/free-solid-svg-icons';

import { AccountService } from '@data/services/account.service';
import { IAuthResponse } from '@interfaces/account/auth-response';

import { LoggerService } from '@core/services/logger.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private readonly accountService: AccountService,
    private readonly logger: LoggerService) { }

  title = 'Authentication Template';

  isExpanded = true;
  isLoggedIn = false;
  authResponse?: IAuthResponse;
  isAdmin = false;

  @ViewChild('sidenav') sidenav: any;

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    
  }

  icons = {
    home: faHome,
    applicationReview: faFileAlt,
    attendance: faCalendar,
    reports: faChartBar,
    profile: faUserTie,
    progress: faTable,
    partners: faHandshake,
    search: faSearch,
    users: faUsers,
    logout: faPowerOff,

    left: faChevronLeft,
    right: faChevronRight

  };

  ngOnInit(): void {
    // Check for auth on page load
    // this.checkLogin();    

    this.onAuthChanged();

    this.accountService.sendAuthStateChangeNotification(this.accountService.isUserAuthenticated());

    // TODO: If on small screen start with sidenav closed

  }

  onAuthChanged() {
    this.accountService.authChanged.subscribe(res => {
      this.logger.trace('app.component authChanged | res: ' + res);

      this.isLoggedIn = res;

      // Recheck login status
      this.checkLogin();
    });
  }

  checkLogin() {
    this.logger.debug('app.component.checkLogin | Checking login status');
    this.isLoggedIn = this.accountService.isUserAuthenticated();

    // Attempt to get user info
    if (this.isLoggedIn) {
      var authResponse = this.accountService.getAuthResponse();

      this.logger.trace('app.component authChanged | auth: ', authResponse);

      if (authResponse) {
        this.authResponse = authResponse;
        this.isAdmin = authResponse.user.isAdmin;
      }
    } else {
      this.authResponse = undefined;
      this.isAdmin = false;
      // Make sure the sidenav is closed if user is not authenticated
      if (this.sidenav) {
        this.sidenav.close();
      }            
        
    }          
  }
}
