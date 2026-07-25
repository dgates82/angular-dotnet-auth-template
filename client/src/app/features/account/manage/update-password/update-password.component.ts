import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { faCancel, faSave } from '@fortawesome/free-solid-svg-icons';
import { IChangePasswordRequest } from '@interfaces/account/change-password-request';
import { PasswordValidators } from '@core/validators/password-validators';

import Swal from 'sweetalert2';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatButton } from '@angular/material/button';
import { PasswordFieldsComponent } from '@shared/password-fields/password-fields.component';

@Component({
    selector: 'app-update-password',
    templateUrl: './update-password.component.html',
    styleUrls: ['./update-password.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, FaIconComponent, MatButton, PasswordFieldsComponent]
})
export class UpdatePasswordComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly formBuilder: FormBuilder) { }

  @Output() passwordUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() passwordUpdateCancelled: EventEmitter<boolean> = new EventEmitter<boolean>();

  icons = {
    cancel: faCancel,
    save: faSave
  }

  passwordUpdateForm = this.formBuilder.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', PasswordValidators.newPasswordValidators()],
    confirmPassword: ['', [Validators.required]]
  }, {validators: PasswordValidators.matchValidator});

  get currentPassword(): any {
    return this.passwordUpdateForm.get('currentPassword')
  }

  get newPassword(): any {
    return this.passwordUpdateForm.get('newPassword')
  }

  ngOnInit(): void {
  }

  onCancel() {
    this.logger.debug('UpdatePasswordComponent.onCancel()');
    this.passwordUpdateCancelled.emit(true);
  }

  onSubmit() {
    this.logger.debug('UpdatePasswordComponent.onSubmit()');

    if (this.passwordUpdateForm.invalid) {
      this.logger.debug('UpdatePasswordComponent.onSubmit | form invalid');
      return;
    }

    // Update password
    const authResponse = this.accountService.getAuthResponse();

    const request: IChangePasswordRequest = {
      email: authResponse?.user?.email ?? '',
      currentPassword: this.currentPassword.value,
      newPassword: this.newPassword.value,
    };
    this.accountService.changePassword(request).then(response => {
      this.logger.debug(`UpdatePasswordComponent.onSubmit | response:`, response);

      if (response.isSuccess) {
        // SWAL confirmation
        Swal.fire({
          title: 'Password updated',
          text: 'Your password has been updated',
          icon: 'success',
          heightAuto: false
        });

        this.passwordUpdated.emit(true);
        return;
      }

      // Update failed
      Swal.fire({
        title: 'Password update failed',
        text: response.message || 'Your password could not be updated',
        icon: 'error',
        heightAuto: false
      });
    })

  }

}
