import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { RegisterComponent } from './register.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';

describe('RegisterComponent', () => {
  let accountService: { register: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const validFormValue = {
    email: 'new.user@example.com',
    newPassword: 'Password1!',
    confirmPassword: 'Password1!',
  };

  beforeEach(() => {
    accountService = { register: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not register while the form is invalid', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    fixture.componentInstance.onRegister();

    expect(accountService.register).not.toHaveBeenCalled();
  });

  it('flags mismatched new/confirm passwords as invalid', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    fixture.componentInstance.registerForm.setValue({ ...validFormValue, confirmPassword: 'Different1!' });

    expect(fixture.componentInstance.registerForm.errors).toEqual({ mismatch: true });
  });

  it('registers and marks the flow complete on success', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    accountService.register.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.registerForm.setValue(validFormValue);
    fixture.componentInstance.onRegister();
    await Promise.resolve();

    expect(accountService.register).toHaveBeenCalledWith({ email: validFormValue.email, password: validFormValue.newPassword });
    expect(fixture.componentInstance.isComplete).toBe(true);
    expect(fixture.componentInstance.isSubmitting).toBe(false);
  });

  it('flags an invalid attempt and stops submitting on error', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    accountService.register.mockRejectedValue(new Error('failed'));

    fixture.componentInstance.registerForm.setValue(validFormValue);
    fixture.componentInstance.onRegister();
    await Promise.resolve();

    expect(fixture.componentInstance.isInvalidAttempt).toBe(true);
    expect(fixture.componentInstance.isSubmitting).toBe(false);
    expect(fixture.componentInstance.isComplete).toBe(false);
    expect(fixture.componentInstance.errorMessage).toBe('An error occurred with your registration');
  });
});
