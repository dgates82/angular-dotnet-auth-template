import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IResetPasswordRequest } from '@interfaces/account/reset-password-request';
import { PasswordValidators } from '@core/validators/password-validators';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PasswordFieldsComponent } from '@shared/features/password-fields/password-fields.component';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['./password-reset.component.scss'],
    imports: [MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardTitle, MatError, MatButton, MatIcon, MatProgressSpinner, RouterLink, PasswordFieldsComponent]
})
export class PasswordResetComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);


  token = "";
  userId = "";

  isInvalidAttempt = false;
  errorMessage = "";

  isFirstLogin = false;

  isSubmitting = false;

  isComplete = false;

  resetPasswordForm = this.formBuilder.group({
    newPassword: ['', PasswordValidators.newPasswordValidators()],
    confirmPassword: ['', [Validators.required]]
  }, {validators: PasswordValidators.matchValidator});

  get newPassword(): FormControl {
    return this.resetPasswordForm.get('newPassword') as FormControl;
  }

  public resetPassword(): void {
    this.logger.debug(`password-reset.component.resetPassword | userId: ${this.userId}`);

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
      userId: this.userId,
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

    // Get the token and account id from the query string
    this.token = this.route.snapshot.queryParams['code'] ?? this.route.snapshot.queryParams['passwordResetCode']
    this.userId = this.route.snapshot.queryParams['userId'] ?? '';
    this.isFirstLogin = this.route.snapshot.queryParams['isFirstLogin'] ?? false;

    this.logger.trace(`password-reset.component.ngOnInit | token: ${this.token} userId: ${this.userId} isFirstLogin: ${this.isFirstLogin}`)

  }


}
