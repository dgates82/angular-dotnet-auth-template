import { TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';

import { EnableTwoFaEmailComponent } from './enable-two-fa-email.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IVerifyAuthenticatorResponse } from '@interfaces/account/verify-authenticator-response';

describe('EnableTwoFaEmailComponent', () => {
  let accountService: {
    sendTwoFaCode: ReturnType<typeof vi.fn>;
    verifyAuthenticator: ReturnType<typeof vi.fn>;
    updateStoredUser: ReturnType<typeof vi.fn>;
  };

  function createFixture(email = 'user@example.com') {
    const fixture = TestBed.createComponent(EnableTwoFaEmailComponent);
    fixture.componentInstance.email = email;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    accountService = {
      sendTwoFaCode: vi.fn().mockResolvedValue({ isSuccess: true }),
      verifyAuthenticator: vi.fn(),
      updateStoredUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [EnableTwoFaEmailComponent],
      providers: [
        provideNgxMask(),
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  describe('ngOnInit', () => {
    it('automatically sends a code to the given email', () => {
      createFixture('user@example.com');

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'user@example.com', method: 'Email' });
    });

    it('sets an error message when the initial send fails', async () => {
      accountService.sendTwoFaCode.mockRejectedValue(new Error('failed'));
      const fixture = createFixture();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Could not send a verification code. Please try again.');
    });
  });

  describe('verifyCode', () => {
    it('marks verified, updates the stored user, and emits twoFaEnabled on success', async () => {
      const fixture = createFixture();
      const emitSpy = vi.spyOn(fixture.componentInstance.twoFaEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: true, message: '', codes: [] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.code.setValue('123456');
      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.verifyAuthenticator).toHaveBeenCalledWith({ email: 'user@example.com', method: 'Email', code: '123456' });
      expect(fixture.componentInstance.isVerified).toBe(true);
      expect(accountService.updateStoredUser).toHaveBeenCalledWith({ twoFactorEnabled: true, twoFactorMethod: 'Email' });
      expect(emitSpy).toHaveBeenCalledWith('Email');
    });

    it('does not mark verified or emit when the code is rejected', async () => {
      const fixture = createFixture();
      const emitSpy = vi.spyOn(fixture.componentInstance.twoFaEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: false, message: 'Invalid code', codes: [] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.isVerified).toBe(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sets a generic error message when verification throws', async () => {
      const fixture = createFixture();
      accountService.verifyAuthenticator.mockRejectedValue(new Error('network error'));

      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Something went wrong. Please try again.');
    });
  });

  describe('back', () => {
    it('emits backClicked', () => {
      const fixture = createFixture();
      const emitSpy = vi.spyOn(fixture.componentInstance.backClicked, 'emit');

      fixture.componentInstance.back();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('resendCode', () => {
    it('sends another code', () => {
      const fixture = createFixture();
      accountService.sendTwoFaCode.mockClear();

      fixture.componentInstance.resendCode();

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'user@example.com', method: 'Email' });
    });
  });
});
