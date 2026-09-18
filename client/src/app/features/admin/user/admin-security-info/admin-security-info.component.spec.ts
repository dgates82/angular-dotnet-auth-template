import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';

import { AdminSecurityInfoComponent } from './admin-security-info.component';
import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';

describe('AdminSecurityInfoComponent', () => {
  let userService: { unlock: ReturnType<typeof vi.fn> };
  let accountService: {
    resetAuthenticator: ReturnType<typeof vi.fn>;
    sendConfirmEmail: ReturnType<typeof vi.fn>;
    sendForgotPassword: ReturnType<typeof vi.fn>;
  };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  const baseUser = (): IApplicationUser => ({
    id: '1',
    email: 'target@example.com',
    emailConfirmed: true,
    twoFactorEnabled: true,
    hasSetPassword: true,
    isActive: true,
    firstName: 'Target',
    lastName: 'User',
  });

  function createFixture(user: IApplicationUser) {
    const fixture = TestBed.createComponent(AdminSecurityInfoComponent);
    fixture.componentInstance.user = user;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    userService = { unlock: vi.fn() };
    accountService = {
      resetAuthenticator: vi.fn(),
      sendConfirmEmail: vi.fn(),
      sendForgotPassword: vi.fn(),
    };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as never);

    TestBed.configureTestingModule({
      imports: [AdminSecurityInfoComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  describe('ngOnInit', () => {
    it('is not locked out when lockoutEnd is unset', () => {
      const fixture = createFixture(baseUser());

      expect(fixture.componentInstance.isLockedOut).toBe(false);
    });

    it('is locked out when lockoutEnd is in the future', () => {
      const future = new Date(Date.now() + 60_000);
      const fixture = createFixture({ ...baseUser(), lockoutEnd: future });

      expect(fixture.componentInstance.isLockedOut).toBe(true);
    });

    it('is not locked out when lockoutEnd is in the past', () => {
      const past = new Date(Date.now() - 60_000);
      const fixture = createFixture({ ...baseUser(), lockoutEnd: past });

      expect(fixture.componentInstance.isLockedOut).toBe(false);
    });
  });

  describe('onResetAuthenticatorClick', () => {
    it('resets the authenticator and clears twoFactorEnabled on confirm+success', async () => {
      const fixture = createFixture(baseUser());
      accountService.resetAuthenticator.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.onResetAuthenticatorClick();
      await Promise.resolve();
      await Promise.resolve();

      expect(accountService.resetAuthenticator).toHaveBeenCalledWith({ email: 'target@example.com' });
      expect(fixture.componentInstance.user.twoFactorEnabled).toBe(false);
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Authenticator Reset' }));
    });

    it('does not call the service when the confirmation is declined', () => {
      swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
      const fixture = createFixture(baseUser());

      fixture.componentInstance.onResetAuthenticatorClick();

      expect(accountService.resetAuthenticator).not.toHaveBeenCalled();
    });

    it('shows an error dialog when resetAuthenticator fails', async () => {
      const fixture = createFixture(baseUser());
      accountService.resetAuthenticator.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.onResetAuthenticatorClick();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });

  describe('onResendEmailConfirmationClick', () => {
    it('sends the confirmation email and shows a success dialog', async () => {
      const fixture = createFixture(baseUser());
      accountService.sendConfirmEmail.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.onResendEmailConfirmationClick();
      await Promise.resolve();

      expect(accountService.sendConfirmEmail).toHaveBeenCalledWith({ email: 'target@example.com' });
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Verification Email Sent' }));
    });

    it('shows an error dialog when sending fails', async () => {
      const fixture = createFixture(baseUser());
      accountService.sendConfirmEmail.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.onResendEmailConfirmationClick();
      await Promise.resolve();
      await Promise.resolve();

      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });

  describe('onResendSetupLinkClick', () => {
    it('sends the setup link and shows a success dialog', async () => {
      const fixture = createFixture(baseUser());
      accountService.sendForgotPassword.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.onResendSetupLinkClick();
      await Promise.resolve();

      expect(accountService.sendForgotPassword).toHaveBeenCalledWith({ email: 'target@example.com' });
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Setup Link Sent' }));
    });

    it('shows an error dialog when sending fails', async () => {
      const fixture = createFixture(baseUser());
      accountService.sendForgotPassword.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.onResendSetupLinkClick();
      await Promise.resolve();
      await Promise.resolve();

      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });

  describe('onUnlockClick', () => {
    it('unlocks the user and clears isLockedOut on confirm+success', async () => {
      const future = new Date(Date.now() + 60_000);
      const fixture = createFixture({ ...baseUser(), lockoutEnd: future });
      userService.unlock.mockResolvedValue({ isSuccess: true });

      fixture.componentInstance.onUnlockClick();
      await Promise.resolve();
      await Promise.resolve();

      expect(userService.unlock).toHaveBeenCalledWith('1');
      expect(fixture.componentInstance.isLockedOut).toBe(false);
      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'User Unlocked' }));
    });

    it('does not call the service when the confirmation is declined', () => {
      swalFireSpy.mockResolvedValue({ isConfirmed: false } as never);
      const fixture = createFixture(baseUser());

      fixture.componentInstance.onUnlockClick();

      expect(userService.unlock).not.toHaveBeenCalled();
    });

    it('shows an error dialog when unlocking fails', async () => {
      const fixture = createFixture(baseUser());
      userService.unlock.mockRejectedValue(new Error('failed'));

      fixture.componentInstance.onUnlockClick();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
  });
});
