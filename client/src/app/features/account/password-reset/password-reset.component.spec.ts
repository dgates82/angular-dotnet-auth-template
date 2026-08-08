import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { PasswordResetComponent } from './password-reset.component';
import { AccountService } from '@data/services/account.service';
import { LoggerService } from '@core/services/logger.service';

describe('PasswordResetComponent', () => {
  let accountService: { resetPassword: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let activatedRoute: { snapshot: { queryParams: Record<string, unknown> } };

  function createFixture() {
    const fixture = TestBed.createComponent(PasswordResetComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    accountService = { resetPassword: vi.fn() };
    router = { navigate: vi.fn() };
    activatedRoute = { snapshot: { queryParams: { code: 'reset-code-123' } } };

    TestBed.configureTestingModule({
      imports: [PasswordResetComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  it('reads the reset code from the query params on init', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance.token).toBe('reset-code-123');
  });

  // This page never establishes a session (unlike login), so it never redirects
  // anywhere on its own - login.component.ts's onLoginResponse() is what enforces
  // is2FaRequired, with a real session, the next time this user actually logs in.
  it('shows the completion message after a first-login reset, without redirecting anywhere', async () => {
    activatedRoute.snapshot.queryParams = { code: 'abc', isFirstLogin: true };
    const fixture = createFixture();

    accountService.resetPassword.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.resetPasswordForm.setValue({
      email: 'admin@example.com',
      newPassword: 'Password1!',
      confirmPassword: 'Password1!',
    });
    fixture.componentInstance.resetPassword();

    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.isComplete).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('surfaces an error message when the reset request fails', async () => {
    const fixture = createFixture();

    accountService.resetPassword.mockResolvedValue({ isSuccess: false });

    fixture.componentInstance.resetPasswordForm.setValue({
      email: 'admin@example.com',
      newPassword: 'Password1!',
      confirmPassword: 'Password1!',
    });
    fixture.componentInstance.resetPassword();

    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.componentInstance.isInvalidAttempt).toBe(true);
    expect(fixture.componentInstance.isSubmitting).toBe(false);
  });

  it('rejects a new password that fails the strength requirements', () => {
    const fixture = createFixture();

    fixture.componentInstance.resetPasswordForm.setValue({
      email: 'admin@example.com',
      newPassword: 'weak',
      confirmPassword: 'weak',
    });

    const newPassword = fixture.componentInstance.resetPasswordForm.get('newPassword')!;
    expect(newPassword.hasError('requiresDigit')).toBe(true);
    expect(newPassword.hasError('requiresUppercase')).toBe(true);
    expect(newPassword.hasError('minlength')).toBe(true);
  });

  it('flags a mismatch between newPassword and confirmPassword', () => {
    const fixture = createFixture();

    fixture.componentInstance.resetPasswordForm.setValue({
      email: 'admin@example.com',
      newPassword: 'Password1!',
      confirmPassword: 'Different1!',
    });

    expect(fixture.componentInstance.resetPasswordForm.hasError('mismatch')).toBe(true);
  });
});
