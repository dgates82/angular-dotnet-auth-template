import { TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';

import { EnableTwoFaPhoneComponent } from './enable-two-fa-phone.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { IVerifyAuthenticatorResponse } from '@interfaces/account/verify-authenticator-response';

describe('EnableTwoFaPhoneComponent', () => {
  let accountService: {
    getUserByEmail: ReturnType<typeof vi.fn>;
    sendTwoFaCode: ReturnType<typeof vi.fn>;
    verifyAuthenticator: ReturnType<typeof vi.fn>;
    updateStoredUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    accountService = {
      getUserByEmail: vi.fn().mockResolvedValue({ phoneNumber: '' } as IApplicationUser),
      sendTwoFaCode: vi.fn(),
      verifyAuthenticator: vi.fn(),
      updateStoredUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [EnableTwoFaPhoneComponent],
      providers: [
        provideNgxMask(),
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  describe('ngOnInit', () => {
    it('looks up the user and prefills the phone number when not routed', async () => {
      accountService.getUserByEmail.mockResolvedValue({ phoneNumber: '5551234567' } as IApplicationUser);
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.email = 'user@example.com';
      fixture.componentInstance.isRouted = false;
      fixture.detectChanges();
      await Promise.resolve();

      expect(accountService.getUserByEmail).toHaveBeenCalledWith('user@example.com');
      expect(fixture.componentInstance.phoneNumber.value).toBe('5551234567');
    });

    it('does not look up the user when routed', () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();

      expect(accountService.getUserByEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendCode', () => {
    it('does not send when there is no phone number', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();

      await fixture.componentInstance.sendCode();

      expect(accountService.sendTwoFaCode).not.toHaveBeenCalled();
    });

    it('sends the code and marks it sent on success', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.componentInstance.email = 'user@example.com';
      fixture.detectChanges();
      accountService.sendTwoFaCode.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.phoneNumber.setValue('5551234567');
      await fixture.componentInstance.sendCode();

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'user@example.com', phoneNumber: '5551234567', method: 'Sms' });
      expect(fixture.componentInstance.isCodeSent).toBe(true);
    });

    it('sets an error message when sending fails', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();
      accountService.sendTwoFaCode.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.phoneNumber.setValue('5551234567');
      await fixture.componentInstance.sendCode();

      expect(fixture.componentInstance.isCodeSent).toBe(false);
      expect(fixture.componentInstance.errorMessage).toBe('Could not send a verification code. Please try again.');
    });
  });

  describe('verifyCode', () => {
    it('marks verified, updates the stored user, and emits twoFaEnabled on success', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.componentInstance.email = 'user@example.com';
      fixture.detectChanges();
      const emitSpy = vi.spyOn(fixture.componentInstance.twoFaEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: true, message: '', codes: [] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.phoneNumber.setValue('5551234567');
      fixture.componentInstance.code.setValue('123456');
      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.isVerified).toBe(true);
      expect(accountService.updateStoredUser).toHaveBeenCalledWith({
        phoneNumber: '5551234567',
        twoFactorEnabled: true,
        twoFactorMethod: 'Phone'
      });
      expect(emitSpy).toHaveBeenCalledWith('Sms');
    });

    it('sets the response message and does not emit when verification is rejected', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();
      const emitSpy = vi.spyOn(fixture.componentInstance.twoFaEnabled, 'emit');
      const response: IVerifyAuthenticatorResponse = { isVerified: false, message: 'Invalid code', codes: [] };
      accountService.verifyAuthenticator.mockResolvedValue(response);

      fixture.componentInstance.code.setValue('000000');
      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.isVerified).toBe(false);
      expect(fixture.componentInstance.errorMessage).toBe('Invalid code');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('sets a generic error message when verification throws', async () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();
      accountService.verifyAuthenticator.mockRejectedValue(new Error('network error'));

      fixture.componentInstance.verifyCode();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Something went wrong. Please try again.');
    });
  });

  describe('back', () => {
    it('emits backClicked', () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();
      const emitSpy = vi.spyOn(fixture.componentInstance.backClicked, 'emit');

      fixture.componentInstance.back();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('resendCode', () => {
    it('delegates to sendCode', () => {
      const fixture = TestBed.createComponent(EnableTwoFaPhoneComponent);
      fixture.componentInstance.isRouted = true;
      fixture.detectChanges();
      accountService.sendTwoFaCode.mockResolvedValue({ isSuccess: true });
      fixture.componentInstance.phoneNumber.setValue('5551234567');

      fixture.componentInstance.resendCode();

      expect(accountService.sendTwoFaCode).toHaveBeenCalled();
    });
  });
});
