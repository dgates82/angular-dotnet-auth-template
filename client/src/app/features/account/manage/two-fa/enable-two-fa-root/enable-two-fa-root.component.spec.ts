import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import Swal from 'sweetalert2';

import { EnableTwoFaRootComponent } from './enable-two-fa-root.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';

// The real template renders EnableTwoFaMethodsComponent/EnableAuthenticatorComponent/
// EnableTwoFaEmailComponent/EnableTwoFaPhoneComponent as real children, gated by this
// component's own show* flags - deliberately never calling fixture.detectChanges() here
// (same approach as navigation-sidenav.component.spec.ts) so those children never need
// their own provider setup; ngOnInit and the click handlers are called directly instead.
describe('EnableTwoFaRootComponent', () => {
  let accountService: { sendAuthStateChangeNotification: ReturnType<typeof vi.fn>; isUserAuthenticated: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;
  let originalTwoFaMethods: string[];

  function configure(paramMapValue: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [EnableTwoFaRootComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(paramMapValue) } } },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  }

  beforeEach(() => {
    accountService = {
      sendAuthStateChangeNotification: vi.fn(),
      isUserAuthenticated: vi.fn().mockReturnValue(true),
    };
    router = { navigate: vi.fn() };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({} as never);
    originalTwoFaMethods = Constants.twoFaMethods;
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
    Constants.twoFaMethods = originalTwoFaMethods;
  });

  describe('ngOnInit', () => {
    it('shows the method picker when multiple methods are configured', () => {
      Constants.twoFaMethods = ['Email', 'Sms', 'Authenticator'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);

      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.showMethods).toBe(true);
      expect(fixture.componentInstance.showEnableTwoFaEmail).toBe(false);
    });

    it('auto-selects the only configured method', () => {
      Constants.twoFaMethods = ['Email'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);

      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.showMethods).toBe(false);
      expect(fixture.componentInstance.showEnableTwoFaEmail).toBe(true);
    });

    it('uses the route email param and marks the flow as routed when no input email was given', () => {
      Constants.twoFaMethods = ['Email', 'Sms'];
      configure({ email: 'routed@example.com' });
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);

      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.email).toBe('routed@example.com');
      expect(fixture.componentInstance.isRouted).toBe(true);
    });

    it('is not routed when there is no email route param', () => {
      Constants.twoFaMethods = ['Email', 'Sms'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);

      fixture.componentInstance.ngOnInit();

      expect(fixture.componentInstance.isRouted).toBe(false);
    });
  });

  describe('onMethodSelected', () => {
    it.each([
      ['Email', 'showEnableTwoFaEmail'],
      ['Authenticator', 'showEnableTwoFaAuthenticator'],
      ['Sms', 'showEnableTwoFaSms'],
    ] as const)('shows the %s method component', (method, flag) => {
      Constants.twoFaMethods = ['Email', 'Sms', 'Authenticator'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);
      fixture.componentInstance.ngOnInit();

      fixture.componentInstance.onMethodSelected(method);

      expect(fixture.componentInstance.showMethods).toBe(false);
      expect(fixture.componentInstance[flag]).toBe(true);
    });
  });

  describe('onBackClicked', () => {
    it('resets to the method picker and hides all method components', () => {
      Constants.twoFaMethods = ['Email', 'Sms'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);
      fixture.componentInstance.ngOnInit();
      fixture.componentInstance.onMethodSelected('Email');

      fixture.componentInstance.onBackClicked();

      expect(fixture.componentInstance.showMethods).toBe(true);
      expect(fixture.componentInstance.showEnableTwoFaEmail).toBe(false);
      expect(fixture.componentInstance.showEnableTwoFaAuthenticator).toBe(false);
      expect(fixture.componentInstance.showEnableTwoFaSms).toBe(false);
    });
  });

  describe('onTwoFaEnabled', () => {
    it('emits twoFaEnabled and stops there when not routed', () => {
      Constants.twoFaMethods = ['Email', 'Sms'];
      configure();
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);
      fixture.componentInstance.ngOnInit();
      const emitSpy = vi.spyOn(fixture.componentInstance.twoFaEnabled, 'emit');

      fixture.componentInstance.onTwoFaEnabled('Email');

      expect(emitSpy).toHaveBeenCalledWith('Email');
      expect(accountService.sendAuthStateChangeNotification).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('notifies auth state change, shows a success dialog, and navigates home when routed', () => {
      Constants.twoFaMethods = ['Email', 'Sms'];
      configure({ email: 'routed@example.com' });
      const fixture = TestBed.createComponent(EnableTwoFaRootComponent);
      fixture.componentInstance.ngOnInit();

      fixture.componentInstance.onTwoFaEnabled('Email');

      expect(accountService.sendAuthStateChangeNotification).toHaveBeenCalledWith(true);
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Two-factor authentication enabled' }));
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  });
});
