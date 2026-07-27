import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IResetPasswordRequest } from '@interfaces/account/reset-password-request';
import { PasswordValidators } from '@core/validators/password-validators';
import { MatCard, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PasswordFieldsComponent } from '@shared/password-fields/password-fields.component';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['./password-reset.component.scss'],
    imports: [MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardTitle, MatCardSubtitle, MatError, MatFormField, MatLabel, MatInput, MatButton, MatIcon, MatProgressSpinner, RouterLink, PasswordFieldsComponent]
})
export class PasswordResetComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);


  token = "";

  isInvalidAttempt = false;
  errorMessage = "";

  isFirstLogin = false;
  subtitle = "";

  isSubmitting = false;

  isComplete = false;

  resetPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    newPassword: ['', PasswordValidators.newPasswordValidators()],
    confirmPassword: ['', [Validators.required]]
  }, {validators: PasswordValidators.matchValidator});

  get email(): FormControl {
    return this.resetPasswordForm.get('email') as FormControl;
  }

  get newPassword(): FormControl {
    return this.resetPasswordForm.get('newPassword') as FormControl;
  }

  public resetPassword(): void {
    this.logger.debug(`password-reset.component.resetPassword | email: ${this.email.value}`);

    if (this.isSubmitting) {
      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.logger.debug(`password-reset.component.resetPassword | form is invalid`)
      return;
    }

    this.isSubmitting = true;

    // Call the account service to reset the password
    const request: IResetPasswordRequest = {
      email: this.email.value,
      password: this.newPassword.value,
      code: this.token
    }

    this.accountService.resetPassword(request).then(response => {
      this.logger.trace(`password-reset.component.resetPassword | response:`, response);
      if (response.isSuccess) {
        this.logger.debug(`password-reset.component.resetPassword | password reset succeeded`)
        // On success display a success message and provide link to login page
        this.isComplete = true;
        this.isSubmitting = false;

        // If this is the user's first login, route to enable 2fa
        if (this.isFirstLogin) {
          // Route to enable 2fa
          this.router.navigate(['/enable2fa', this.email.value]);
        }
      }
      else {
        this.logger.debug(`password-reset.component.resetPassword | password reset failed`)

        this.isSubmitting = false;

        // Display an error to the user
        this.isInvalidAttempt = true;
        this.errorMessage = response.message || "Password reset failed. Please try again."
      }
    }).catch(err => {
      this.logger.error(`password-reset.component.resetPassword | error:`, err);
      this.isInvalidAttempt = true;
      this.errorMessage = "Password reset failed. Please try again."
      this.isSubmitting = false;
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
