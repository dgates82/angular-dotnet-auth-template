import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';

import { faSquareCheck, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { PasswordValidators } from '@core/validators/password-validators';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { IResponse } from '@interfaces/response';
import { IRegisterRequest } from '../../../interfaces/account/register-request';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly router: Router) { }

  isSubmitting: boolean = false;
  isComplete: boolean = false;
  isInvalidAttempt: boolean = false;
  errorMessage: string = "";

  icons = {
    invalid: faSquareXmark,
    valid: faSquareCheck
  }

  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    newPassword: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(8),
      PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), {
        requiresDigit: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), {
        requiresUppercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), {
        requiresLowercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&_])"), {
        requiresSpecialChars: true
      }),
    ])
    ),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: PasswordValidators.matchValidator})

  get email(): any {
    return this.registerForm.get('email');
  }

  get newPassword(): any {
    return this.registerForm.get('newPassword')
  }

  get newPasswordControl(): AbstractControl {
    return this.registerForm.controls['newPassword'];
  }

  get confirmPassword(): any {
    return this.registerForm.get('confirmPassword');
  }

  get passwordValid() {
    return !this.newPasswordControl.valid;
  }

  get requiredValid() {
    const result = !this.newPasswordControl.hasError('required')
    return result;
  }

  get minLengthValid() {
    return !this.newPasswordControl.hasError('minlength');
  }

  get requiresDigitValid() {
    return !this.newPasswordControl.hasError('requiresDigit');
  }

  get requiresUppercaseValid() {
    return !this.newPasswordControl.hasError('requiresUppercase');
  }

  get requiresLowercaseValid() {
    return !this.newPasswordControl.hasError('requiresLowercase');
  }

  get requiresSpecialCharsValid() {
    return !this.newPasswordControl.hasError('requiresSpecialChars');
  }

  get passwordsMatchValid() {
    return !this.registerForm.hasError('mismatch');
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
