import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideNgxMask } from 'ngx-mask';

import { EnableAuthenticatorComponent } from './enable-authenticator.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';
import { IEnableAuthenticatorResponse } from '@interfaces/account/enable-authenticator-response';
import { IVerifyAuthenticatorResponse } from '@interfaces/account/verify-authenticator-response';

// Deliberately not calling fixture.detectChanges() a second time after async state
// changes - the real template renders QRCodeComponent/RecoveryCodesListComponent once
// authenticatorUri/isVerified are set, and those don't need exercising here; asserting
// component state directly covers ngOnInit/verifyCode's own logic.
describe('EnableAuthenticatorComponent', () => {
  let accountService: {
    enableAuthenticator: ReturnType<typeof vi.fn>;
    verifyAuthenticator: ReturnType<typeof vi.fn>;
    updateStoredUser: ReturnType<typeof vi.fn>;
  };
  let activatedRoute: { snapshot: { paramMap: ReturnType<typeof convertToParamMap> } };

  function configure(paramMapValue: Record<string, string> = {}) {
    activatedRoute = { snapshot: { paramMap: convertToParamMap(paramMapValue) } };

    TestBed.configureTestingModule({
      imports: [EnableAuthenticatorComponent],
      providers: [
        provideNgxMask(),
        { provide: AccountService, useValue: accountService },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  }

  beforeEach(() => {
    accountService = {
      enableAuthenticator: vi.fn().mockResolvedValue({ authenticatorUri: 'otpauth://totp/x', sharedKey: 'KEY' } as IEnableAuthenticatorResponse),
      verifyAuthenticator: vi.fn(),
      updateStoredUser: vi.fn(),
    };
  });

  describe('ngOnInit', () => {
    it('loads the QR code details using the given email', async () => {
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.componentInstance.email = 'user@example.com';
      fixture.detectChanges();
      await Promise.resolve();

      expect(accountService.enableAuthenticator).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(fixture.componentInstance.authenticatorUri).toBe('otpauth://totp/x');
      expect(fixture.componentInstance.sharedKey).toBe('KEY');
    });

    it('falls back to the route email param when 2FA is required and no email was provided', async () => {
      const originalIs2FaRequired = Constants.is2FaRequired;
      Constants.is2FaRequired = true;
      try {
        configure({ email: 'routed@example.com' });
        const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
        fixture.detectChanges();
        await Promise.resolve();

        expect(accountService.enableAuthenticator).toHaveBeenCalledWith({ email: 'routed@example.com' });
        expect(fixture.componentInstance.email).toBe('routed@example.com');
      } finally {
        Constants.is2FaRequired = originalIs2FaRequired;
      }
    });

    it('sets an error message when loading fails', async () => {
      accountService.enableAuthenticator.mockRejectedValue(new Error('failed'));
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.detectChanges();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Could not load authenticator setup. Please refresh the page to try again.');
    });
  });

  describe('verifyCode', () => {
    it('marks verified, stores recovery codes, updates the stored user, and emits on success', async () => {
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.componentInstance.email = 'user@example.com';
      fixture.detectChanges();
      await Promise.resolve();
      const emitSpy = vi.spyOn(fixture.componentInstance.authenticatorEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: true, message: '', codes: ['abc-123', 'def-456'] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.code.setValue('123456');
      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.verifyAuthenticator).toHaveBeenCalledWith({ email: 'user@example.com', method: 'Authenticator', code: '123456' });
      expect(fixture.componentInstance.isVerified).toBe(true);
      expect(fixture.componentInstance.recoveryCodes).toEqual(['abc-123', 'def-456']);
      expect(accountService.updateStoredUser).toHaveBeenCalledWith({ twoFactorEnabled: true, twoFactorMethod: 'Authenticator' });
      expect(emitSpy).toHaveBeenCalledWith('Authenticator');
    });

    it('sets the response message and does not emit when verification is rejected', async () => {
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.detectChanges();
      await Promise.resolve();
      const emitSpy = vi.spyOn(fixture.componentInstance.authenticatorEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: false, message: 'Invalid code', codes: [] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.isVerified).toBe(false);
      expect(fixture.componentInstance.errorMessage).toBe('Invalid code');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sets a generic error message when verification throws', async () => {
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.detectChanges();
      await Promise.resolve();
      accountService.verifyAuthenticator.mockRejectedValue(new Error('network error'));

      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Something went wrong. Please try again.');
    });
  });

  describe('back', () => {
    it('emits backClicked', () => {
      configure();
      const fixture = TestBed.createComponent(EnableAuthenticatorComponent);
      fixture.detectChanges();
      const emitSpy = vi.spyOn(fixture.componentInstance.backClicked, 'emit');

      fixture.componentInstance.back();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
