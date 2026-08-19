import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { TwoFaRootComponent } from './two-fa-root.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';
import { IApplicationUser } from '@interfaces/account/application-user';

describe('TwoFaRootComponent', () => {
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
    TestBed.configureTestingModule({
      imports: [TwoFaRootComponent],
      providers: [
        { provide: AccountService, useValue: { resetAuthenticator: vi.fn() } },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ]
    });
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
});
