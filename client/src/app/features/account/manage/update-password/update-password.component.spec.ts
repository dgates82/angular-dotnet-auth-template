import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';

import { UpdatePasswordComponent } from './update-password.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IAuthResponse } from '@interfaces/account/auth-response';

describe('UpdatePasswordComponent', () => {
  let accountService: { getAuthResponse: ReturnType<typeof vi.fn>; changePassword: ReturnType<typeof vi.fn> };
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  const validPasswordValue = {
    currentPassword: 'OldPassword1!',
    newPassword: 'NewPassword1!',
    confirmPassword: 'NewPassword1!',
  };

  beforeEach(() => {
    accountService = {
      getAuthResponse: vi.fn().mockReturnValue({ user: { email: 'admin@example.com' } } as IAuthResponse),
      changePassword: vi.fn(),
    };
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({} as never);

    TestBed.configureTestingModule({
      imports: [UpdatePasswordComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  });

  afterEach(() => {
    swalFireSpy.mockRestore();
  });

  it('renders without errors', () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not submit while the form is invalid', () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();

    fixture.componentInstance.onSubmit();

    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('flags mismatched new/confirm passwords as invalid', () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();

    fixture.componentInstance.passwordUpdateForm.setValue({
      ...validPasswordValue,
      confirmPassword: 'SomethingElse1!',
    });

    expect(fixture.componentInstance.passwordUpdateForm.errors).toEqual({ mismatch: true });
  });

  it('submits the change request using the logged-in user email and emits passwordUpdated on success', async () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.passwordUpdated, 'emit');
    accountService.changePassword.mockResolvedValue({ isSuccess: true });

    fixture.componentInstance.passwordUpdateForm.setValue(validPasswordValue);
    fixture.componentInstance.onSubmit();
    await Promise.resolve();

    expect(accountService.changePassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      currentPassword: validPasswordValue.currentPassword,
      newPassword: validPasswordValue.newPassword,
    });
    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Password updated' }));
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('shows an error dialog and does not emit when the update fails', async () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.passwordUpdated, 'emit');
    accountService.changePassword.mockResolvedValue({ isSuccess: false, message: 'Current password incorrect' });

    fixture.componentInstance.passwordUpdateForm.setValue(validPasswordValue);
    fixture.componentInstance.onSubmit();
    await Promise.resolve();

    expect(swalFireSpy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Password update failed', text: 'Current password incorrect' }));
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits passwordUpdateCancelled on cancel', () => {
    const fixture = TestBed.createComponent(UpdatePasswordComponent);
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.passwordUpdateCancelled, 'emit');

    fixture.componentInstance.onCancel();

    expect(emitSpy).toHaveBeenCalledWith(true);
  });
});
