import { TestBed } from '@angular/core/testing';
import { provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { LoginTwoFactorComponent } from './login-two-factor.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IAuthResponse } from '@interfaces/account/auth-response';

describe('LoginTwoFactorComponent', () => {
  let accountService: { login2fa: ReturnType<typeof vi.fn>; sendTwoFaCode: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  function createFixture() {
    const fixture = TestBed.createComponent(LoginTwoFactorComponent);
    fixture.componentInstance.email = 'user@example.com';
    fixture.componentInstance.twoFactorMethod = 'Email';
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    accountService = {
      login2fa: vi.fn(),
      sendTwoFaCode: vi.fn().mockResolvedValue({ isSuccess: true }),
    };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({} as never);

    TestBed.configureTestingModule({
      imports: [LoginTwoFactorComponent],
      providers: [
        provideNgxMask(),
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  describe('ngOnInit', () => {
    it('focuses the code input after the initial delay', () => {
      vi.useFakeTimers();
      try {
        const fixture = createFixture();
        const focusSpy = vi.spyOn(fixture.componentInstance.twoFaCodeInput!.nativeElement, 'focus');

        vi.advanceTimersByTime(100);

        expect(focusSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('login2Fa', () => {
    it('does not attempt to log in while the form is invalid', () => {
      const fixture = createFixture();

      fixture.componentInstance.login2Fa();

      expect(accountService.login2fa).not.toHaveBeenCalled();
    });

    it('logs in and emits loginResponse on success', async () => {
      const fixture = createFixture();
      const emitSpy = vi.spyOn(fixture.componentInstance.loginResponse, 'emit');
      const response = { isAuthSuccessful: true, requiresTwoFactor: false } as IAuthResponse;
      accountService.login2fa.mockResolvedValue(response);

      fixture.componentInstance.twoFaCode.setValue('123456');
      fixture.componentInstance.login2Fa();
      await Promise.resolve();

      expect(accountService.login2fa).toHaveBeenCalledWith({ email: 'user@example.com', twoFactorProvider: 'Email', twoFactorCode: '123456' });
      expect(emitSpy).toHaveBeenCalledWith(response);
    });

    it('sets a generic error message when login2fa fails', async () => {
      const fixture = createFixture();
      accountService.login2fa.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.twoFaCode.setValue('123456');
      fixture.componentInstance.login2Fa();
      await Promise.resolve();
      await Promise.resolve();

      expect(fixture.componentInstance.errorMessage).toBe('Something went wrong. Please try again.');
    });

    it('rejects codes that are not exactly 6 digits', () => {
      const fixture = createFixture();

      fixture.componentInstance.twoFaCode.setValue('12a45');
      expect(fixture.componentInstance.twoFaCode.valid).toBe(false);

      fixture.componentInstance.twoFaCode.setValue('123456');
      expect(fixture.componentInstance.twoFaCode.valid).toBe(true);
    });
  });

  describe('resendCode', () => {
    it('sends another code', async () => {
      const fixture = createFixture();

      await fixture.componentInstance.resendCode();

      expect(accountService.sendTwoFaCode).toHaveBeenCalledWith({ email: 'user@example.com', method: 'Email' });
      expect(swalFireSpy).not.toHaveBeenCalled();
    });

    it('shows an error dialog when resending fails', async () => {
      const fixture = createFixture();
      accountService.sendTwoFaCode.mockRejectedValue(new Error('failed'));

      await fixture.componentInstance.resendCode();

      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });
});
