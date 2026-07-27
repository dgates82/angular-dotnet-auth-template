import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';

import { PasswordValidators } from '@core/validators/password-validators';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IRegisterRequest } from '../../../interfaces/account/register-request';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PasswordFieldsComponent } from '@shared/password-fields/password-fields.component';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    imports: [MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardTitle, MatError, MatFormField, MatLabel, MatInput, MatButton, MatIcon, MatProgressSpinner, PasswordFieldsComponent]
})
export class RegisterComponent {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);


  isSubmitting = false;
  isComplete = false;
  isInvalidAttempt = false;
  errorMessage = "";

  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    newPassword: new FormControl('', PasswordValidators.newPasswordValidators()),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: PasswordValidators.matchValidator})

  get email(): FormControl {
    return this.registerForm.get('email') as FormControl;
  }

  get newPassword(): FormControl {
    return this.registerForm.get('newPassword') as FormControl;
  }

  onRegister(): void {
    this.logger.info("RegisterComponent: onRegister()");

    if (this.registerForm.invalid) {
      this.logger.info("RegisterComponent: onRegister() invalid form");
      return;
    }

    this.isSubmitting = true;

    const request: IRegisterRequest = {
      email: this.email.value,
      password: this.newPassword.value
    }

    this.accountService.register(request).then(
      () => {
        this.logger.info("RegisterComponent: onRegister() success");

        this.isComplete = true;
        this.isSubmitting = false;

      },
      () => {
        this.logger.error("RegisterComponent: onRegister() error");
        this.isInvalidAttempt = true;
        this.isSubmitting = false;
        this.errorMessage = "An error occurred with your registration";
      }
    );

  }

}
