import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IResetPasswordRequest } from '@interfaces/account/reset-password-request';
import { Constants } from '@core/constants';
import { PasswordValidators } from '@core/validators/password-validators';
import { faSquareCheck, faSquareXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router) { }

  token: string = "";
  
  isInvalidAttempt: boolean = false;
  errorMessage: string = "";

  isFirstLogin: boolean = false;
  subtitle: string = "";

  isComplete: boolean = false;

  icons = {        
    invalid: faSquareXmark,
    valid: faSquareCheck
  }

  resetPasswordForm = this.formBuilder.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['',
      Validators.compose([
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
        })      
      ]),
    ],
    confirmPassword: ['', [Validators.required]]
  }, {validators: PasswordValidators.matchValidator});

  get email(): any {
    return this.resetPasswordForm.get('email');
  }

  get newPassword(): any {
    return this.resetPasswordForm.get('newPassword')
  }

  get newPasswordControl(): AbstractControl {
    return this.resetPasswordForm.controls['newPassword'];
  }

  get confirmPassword(): any {
    return this.resetPasswordForm.get('confirmPassword');
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
    return !this.resetPasswordForm.hasError('mismatch');
  }

  public resetPassword(): void {    
    this.logger.debug(`password-reset.component.resetPassword | email: ${this.email.value}`);

    if (this.resetPasswordForm.invalid) {
      this.logger.debug(`password-reset.component.resetPassword | form is invalid`)
      return;        
    }
        

    // Call the account service to reset the password
    const request: IResetPasswordRequest = {
      email: this.email.value,
      password: this.newPassword.value,
      code: this.token
    }

    this.accountService.resetPassword(request).then(response => {
      this.logger.trace(`password-reset.component.resetPassword | response: ${JSON.stringify(response)}`);
      if (response.isSuccess) {
        this.logger.debug(`password-reset.component.resetPassword | password reset succeeded`)
        // On success display a success message and provide link to login page
        this.isComplete = true;

        // HACK: Should I route to a new page?

        // If 2fa is required and this is the user's first login, route to enable 2fa
        if (this.isFirstLogin && Constants.is2FaRequired) {
          // Route to enable 2fa
          this.router.navigate(['/enable2fa', this.email.value]);

        }
      }
      else {
        this.logger.debug(`password-reset.component.resetPassword | password reset failed`)

        // TODO: Try to determine what the error was

        // Display an error to the user        
        this.isInvalidAttempt = true;
        this.errorMessage = "Password reset failed. Please try again."
      }
    });

    
  }

  ngOnInit(): void {
    this.logger.trace(`password-reset.component.ngOnInit`)

    // Get the token from the query string
    this.token = this.route.snapshot.queryParams['code'] ?? this.route.snapshot.queryParams['passwordResetCode']
    this.isFirstLogin = this.route.snapshot.queryParams['isFirstLogin'] ?? false;

    this.logger.trace(`password-reset.component.ngOnInit | token: ${this.token} isFirstLogin: ${this.isFirstLogin}`)
    if (this.isFirstLogin) {
      this.subtitle = "Create a password to continue.";
    }

  }
}
