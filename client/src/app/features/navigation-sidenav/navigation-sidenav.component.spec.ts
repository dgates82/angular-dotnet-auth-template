import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';

import { NavigationSidenavComponent } from './navigation-sidenav.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { Constants } from '@core/constants';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IAuthResponse } from '@interfaces/account/auth-response';

// The component renders MatSidenav/TwoFaNudgeBannerComponent/DemoBannerComponent/etc. in
// its real template - fixture.detectChanges() is deliberately never called here, so the
// template never renders and those children never need their own provider setup. The
// constructor still runs on createComponent() (that's real DI, not template-dependent),
// so lifecycle methods are invoked directly instead.
describe('NavigationSidenavComponent', () => {
  let accountService: {
    authChanged: BehaviorSubject<boolean>;
    sendAuthStateChangeNotification: ReturnType<typeof vi.fn>;
    isUserAuthenticated: ReturnType<typeof vi.fn>;
    getAuthResponse: ReturnType<typeof vi.fn>;
    isInRole: ReturnType<typeof vi.fn>;
    getLoggedInUser: ReturnType<typeof vi.fn>;
  };
  let routerEvents: Subject<unknown>;
  let router: { events: Subject<unknown>; url: string };
  let breakpointObserver: { observe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    accountService = {
      authChanged: new BehaviorSubject<boolean>(false),
      sendAuthStateChangeNotification: vi.fn(),
      isUserAuthenticated: vi.fn().mockReturnValue(false),
      getAuthResponse: vi.fn(),
      isInRole: vi.fn().mockReturnValue(false),
      getLoggedInUser: vi.fn().mockReturnValue(null),
    };
    routerEvents = new Subject<unknown>();
    router = { events: routerEvents, url: '/' };
    breakpointObserver = { observe: vi.fn().mockReturnValue(of({ matches: false })) };

    TestBed.configureTestingModule({
      imports: [NavigationSidenavComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: BreakpointObserver, useValue: breakpointObserver },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('constructor / router events', () => {
    it('collapses and closes the sidenav when navigation lands on /application', () => {
      router.url = '/application';
      const fixture = TestBed.createComponent(NavigationSidenavComponent);
      const closeSpy = vi.fn();
      fixture.componentInstance.sidenav = { close: closeSpy } as never;

      routerEvents.next(new NavigationEnd(1, '/application', '/application'));

      expect(fixture.componentInstance.isExpanded).toBe(false);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('does not collapse the sidenav for navigation to other routes', () => {
      router.url = '/dashboard';
      const fixture = TestBed.createComponent(NavigationSidenavComponent);
      const closeSpy = vi.fn();
      fixture.componentInstance.sidenav = { close: closeSpy } as never;

      routerEvents.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      expect(fixture.componentInstance.isExpanded).toBe(true);
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('collapses the sidenav when no stored state exists and the screen is small', () => {
      breakpointObserver.observe.mockReturnValue(of({ matches: true }));
      const fixture = TestBed.createComponent(NavigationSidenavComponent);

      fixture.componentInstance.ngOnInit();

      expect(breakpointObserver.observe).toHaveBeenCalledWith('(max-width: 800px)');
      expect(fixture.componentInstance.isExpanded).toBe(false);
    });

    it('uses the stored sidenav state instead of checking the breakpoint', () => {
      localStorage.setItem(Constants.LocalStorageKeys.sideNavExpanded, 'false');
      const fixture = TestBed.createComponent(NavigationSidenavComponent);

      fixture.componentInstance.ngOnInit();

      expect(breakpointObserver.observe).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isExpanded).toBe(false);
    });

    it('sends the current auth state notification', () => {
      accountService.isUserAuthenticated.mockReturnValue(true);
      const fixture = TestBed.createComponent(NavigationSidenavComponent);

      fixture.componentInstance.ngOnInit();

      expect(accountService.sendAuthStateChangeNotification).toHaveBeenCalledWith(true);
    });
  });

  describe('checkLogin (via authChanged)', () => {
    it('populates auth state, admin flag, and 2FA requirement when logged in', () => {
      const originalIs2FaRequired = Constants.is2FaRequired;
      Constants.is2FaRequired = true;
      try {
        const authResponse = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
        const user = { id: '1', email: 'admin@example.com', twoFactorEnabled: false } as IApplicationUser;
        accountService.isUserAuthenticated.mockReturnValue(true);
        accountService.getAuthResponse.mockReturnValue(authResponse);
        accountService.isInRole.mockReturnValue(true);
        accountService.getLoggedInUser.mockReturnValue(user);

        const fixture = TestBed.createComponent(NavigationSidenavComponent);
        const closeSpy = vi.fn();
        fixture.componentInstance.sidenav = { close: closeSpy } as never;
        // onAuthChanged() (which subscribes to authChanged) is only wired up in
        // ngOnInit, not the constructor - it has to run before authChanged.next() has
        // any subscriber to reach.
        fixture.componentInstance.ngOnInit();

        accountService.authChanged.next(true);

        expect(fixture.componentInstance.isLoggedIn).toBe(true);
        expect(fixture.componentInstance.authResponse).toEqual(authResponse);
        expect(fixture.componentInstance.isAdmin).toBe(true);
        expect(fixture.componentInstance.twoFaSetupRequired).toBe(true);
        expect(closeSpy).toHaveBeenCalled();
      } finally {
        Constants.is2FaRequired = originalIs2FaRequired;
      }
    });

    it('resets auth state and closes the sidenav when logged out', () => {
      const fixture = TestBed.createComponent(NavigationSidenavComponent);
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.authResponse = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
      fixture.componentInstance.isAdmin = true;
      const closeSpy = vi.fn();
      fixture.componentInstance.sidenav = { close: closeSpy } as never;

      accountService.authChanged.next(false);

      expect(fixture.componentInstance.isLoggedIn).toBe(false);
      expect(fixture.componentInstance.authResponse).toBeUndefined();
      expect(fixture.componentInstance.isAdmin).toBe(false);
      expect(fixture.componentInstance.twoFaSetupRequired).toBe(false);
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('toggleSidebar', () => {
    it('flips isExpanded and persists it to local storage', () => {
      const fixture = TestBed.createComponent(NavigationSidenavComponent);

      fixture.componentInstance.toggleSidebar();

      expect(fixture.componentInstance.isExpanded).toBe(false);
      expect(localStorage.getItem(Constants.LocalStorageKeys.sideNavExpanded)).toBe('false');
    });
  });
});
