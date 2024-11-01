import {Component, OnInit, ViewChild} from '@angular/core';
import {AccountService} from "@data/services/account.service";
import {LoggerService} from "@core/services/logger.service";
import {NavigationEnd, Router} from "@angular/router";
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

@Component({
  selector: 'app-navigation-sidenav',
  templateUrl: './navigation-sidenav.component.html',
  styleUrl: './navigation-sidenav.component.scss'
})
export class NavigationSidenavComponent implements OnInit{

  constructor(private readonly accountService: AccountService,
              private readonly logger: LoggerService,
              private readonly router: Router,
              private breakpointObserver: BreakpointObserver) {
    router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
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

  @ViewChild('sidenav') sidenav: any;

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
