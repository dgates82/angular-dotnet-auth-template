import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';

import { PasswordValidators } from '@core/validators/password-validators';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IResponse } from '@interfaces/response';
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
export class RegisterComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly router: Router) { }

  isSubmitting: boolean = false;
  isComplete: boolean = false;
  isInvalidAttempt: boolean = false;
  errorMessage: string = "";

  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    newPassword: new FormControl('', PasswordValidators.newPasswordValidators()),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: PasswordValidators.matchValidator})

  get email(): any {
    return this.registerForm.get('email');
  }

  get newPassword(): any {
    return this.registerForm.get('newPassword')
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
      (result: IResponse) => {
        this.logger.info("RegisterComponent: onRegister() success");

        this.isComplete = true;
        this.isSubmitting = false;

      },
      (error: any) => {
        this.logger.error("RegisterComponent: onRegister() error");
        this.isInvalidAttempt = true;
        this.isSubmitting = false;
        this.errorMessage = "An error occurred with your registration";
      }
    );

  }

  ngOnInit(): void {

  }

}
