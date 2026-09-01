import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {AccountService} from "@data/services/account.service";
import {LoggerService} from "@core/services/logger.service";
import { NavigationEnd, Router, RouterLink, RouterOutlet } from "@angular/router";
import {BreakpointObserver} from "@angular/cdk/layout";
import {filter} from "rxjs/operators";
import {IAuthResponse} from "@interfaces/account/auth-response";
import {Constants} from "@core/constants";
import {
  faCalendar,
  faChartBar, faChevronLeft, faChevronRight,
  faFileAlt,
  faHandshake,
  faHome, faPowerOff, faSearch,
  faTable, faUsers,
  faUserTie
} from "@fortawesome/free-solid-svg-icons";
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { NgClass } from '@angular/common';
import { MatNavList, MatListItem, MatDivider } from '@angular/material/list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatButton } from '@angular/material/button';
import { TwoFaNudgeBannerComponent } from '@shared/two-fa-nudge-banner/two-fa-nudge-banner.component';
import { DemoBannerComponent } from '@shared/demo-banner/demo-banner.component';
import { VersionFooterComponent } from '@shared/version-footer/version-footer.component';

@Component({
    selector: 'app-navigation-sidenav',
    templateUrl: './navigation-sidenav.component.html',
    styleUrl: './navigation-sidenav.component.scss',
    imports: [MatSidenavContainer, MatSidenav, NgClass, MatNavList, MatListItem, RouterLink, FaIconComponent, MatDivider, MatButton, MatSidenavContent, RouterOutlet, TwoFaNudgeBannerComponent, DemoBannerComponent, VersionFooterComponent]
})
export class NavigationSidenavComponent implements OnInit{
  private readonly accountService = inject(AccountService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);


  constructor() {
    const logger = this.logger;
    const router = this.router;

    router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      logger.trace(`app.component | url: ${router.url}`);

      // Check route. If user is going to application page close sidenav
      if (router.url === '/application') {
        this.isExpanded = false;
        this.sidenav.close();
      }
    });
  }

  title = 'Authentication Template';

  isExpanded = true;
  isLoggedIn = false;
  authResponse?: IAuthResponse;
  isAdmin = false;
  twoFaSetupRequired = false;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    // Store current selection in local storage
    localStorage.setItem(Constants.LocalStorageKeys.sideNavExpanded, this.isExpanded.toString());
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
    // Check for saved sidenav state
    const isExpanded = localStorage.getItem(Constants.LocalStorageKeys.sideNavExpanded);

    // If nothing is retrieved from local storage, check if the screen is small
    if (!isExpanded) {
      this.breakpointObserver.observe('(max-width: 800px)').subscribe(result => {
        if (result.matches) {
          this.logger.trace('app.component | Screen is small. Collapsing sidenav')
          this.isExpanded = false;
        }
      });
    } else {
      this.isExpanded = isExpanded ? isExpanded === 'true' : true;
    }

    this.onAuthChanged();

    this.accountService.sendAuthStateChangeNotification(this.accountService.isUserAuthenticated());
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
      const authResponse = this.accountService.getAuthResponse();

      this.logger.trace('app.component authChanged | auth: ', authResponse);

      if (authResponse) {
        this.authResponse = authResponse;
        this.isAdmin = this.accountService.isInRole('Admin');
      }

      // Mirrors twoFaRequiredGuard's own condition.
      const user = this.accountService.getLoggedInUser();
      this.twoFaSetupRequired = Constants.is2FaRequired && !!user && !user.twoFactorEnabled;

      // Make sure the sidenav is closed until 2FA setup is complete
      if (this.sidenav && this.twoFaSetupRequired) {
        this.sidenav.close();
      }
    } else {
      this.authResponse = undefined;
      this.isAdmin = false;
      this.twoFaSetupRequired = false;
      // Make sure the sidenav is closed if user is not authenticated
      if (this.sidenav) {
        this.sidenav.close();
      }

    }
  }

}
