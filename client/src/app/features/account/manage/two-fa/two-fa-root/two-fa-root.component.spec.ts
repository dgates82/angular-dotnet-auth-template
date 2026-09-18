import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import Swal from 'sweetalert2';

import { TwoFaRootComponent } from './two-fa-root.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { IApplicationUser } from '@interfaces/account/application-user';

describe('TwoFaRootComponent', () => {
  let accountService: { resetAuthenticator: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  function buildUser(overrides: Partial<IApplicationUser> = {}): IApplicationUser {
    return {
      id: '1',
      email: 'admin@example.com',
      emailConfirmed: true,
      twoFactorEnabled: false,
      hasSetPassword: true,
      isActive: true,
      firstName: 'Admin',
      lastName: 'User',
      ...overrides,
    };
  }

  function createFixture(user: IApplicationUser, autoStartTwoFa = false) {
    const fixture = TestBed.createComponent(TwoFaRootComponent);
    fixture.componentInstance.user = user;
    fixture.componentInstance.autoStartTwoFa = autoStartTwoFa;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    accountService = { resetAuthenticator: vi.fn() };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as never);

    TestBed.configureTestingModule({
      imports: [TwoFaRootComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  it('leaves 2FA setup untouched when autoStartTwoFa is false (default)', () => {
    const fixture = createFixture(buildUser({ twoFactorEnabled: false }), false);

    expect(fixture.componentInstance.isTwoFaEnabled).toBe(false);
    expect(fixture.componentInstance.isTwoFaEnabling).toBe(false);
    expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Disabled');
  });

  it('auto-starts the enable flow when arriving via the nudge banner deep link', () => {
    const fixture = createFixture(buildUser({ twoFactorEnabled: false }), true);

    expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
    expect(fixture.componentInstance.isTwoFaEnabling).toBe(true);
    expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Enabling...');
  });

  it('does not clobber an already-configured account even with autoStartTwoFa set', () => {
    const fixture = createFixture(buildUser({ twoFactorEnabled: true }), true);

    expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
    expect(fixture.componentInstance.isTwoFaEnabling).toBe(false);
    expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Enabled');
  });

  describe('onEnabledChanged', () => {
    it('starts the enable flow when toggled on', () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: false }));

      fixture.componentInstance.onEnabledChanged({ checked: true } as never);

      expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
      expect(fixture.componentInstance.isTwoFaEnabling).toBe(true);
      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Enabling...');
    });

    it('cancels an in-progress enable flow when toggled off and 2FA was never enabled', () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: false }));

      fixture.componentInstance.onEnabledChanged({ checked: false } as never);

      expect(swalFireSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isTwoFaEnabling).toBe(false);
      expect(fixture.componentInstance.isTwoFaEnabled).toBe(false);
      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Disabled');
    });

    it('disables 2FA when the user confirms the Swal dialog and resetAuthenticator succeeds', async () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: true }));
      accountService.resetAuthenticator.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.onEnabledChanged({ checked: false } as never);
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.resetAuthenticator).toHaveBeenCalledWith({ email: 'admin@example.com' });
      expect(fixture.componentInstance.isTwoFaEnabled).toBe(false);
      expect(fixture.componentInstance.isTwoFaEnabling).toBe(false);
      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Disabled');
    });

    it('reverts to enabled and shows an error dialog when resetAuthenticator fails', async () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: true }));
      accountService.resetAuthenticator.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.onEnabledChanged({ checked: false } as never);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Enabled');
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });

    it('reverts to enabled without calling resetAuthenticator when the Swal dialog is cancelled', async () => {
      swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
      const fixture = createFixture(buildUser({ twoFactorEnabled: true }));

      fixture.componentInstance.onEnabledChanged({ checked: false } as never);
      await Promise.resolve();

      expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
    });
  });

  describe('onAuthenticatorEnabled', () => {
    it('marks 2FA as enabled', () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: false }));

      fixture.componentInstance.onAuthenticatorEnabled('Authenticator');

      expect(fixture.componentInstance.isTwoFaEnabled).toBe(true);
      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Enabled');
    });
  });

  describe('onChangeTwoFaMethodClick', () => {
    it('switches to the updating state', () => {
      const fixture = createFixture(buildUser({ twoFactorEnabled: true }));

      fixture.componentInstance.onChangeTwoFaMethodClick();

      expect(fixture.componentInstance.isTwoFaEnabledString).toBe('Updating...');
      expect(fixture.componentInstance.isTwoFaEnabling).toBe(true);
    });
  });
});
