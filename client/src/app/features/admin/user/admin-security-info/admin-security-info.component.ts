import { Component, Input, OnInit, inject } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import Swal from 'sweetalert2';
import { IEmailOnlyRequest } from '@interfaces/account/email-only-request';
import { IForgotPasswordRequest } from '@interfaces/account/forgot-password-request';
import { MatCard, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-admin-security-info',
    templateUrl: './admin-security-info.component.html',
    styleUrls: ['./admin-security-info.component.scss'],
    imports: [MatCard, MatCardTitle, MatButton, MatIcon]
})
export class AdminSecurityInfoComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly userService = inject(UserService);
  private readonly accountService = inject(AccountService);


  @Input() user!: IApplicationUser;

  isLockedOut = false;

  ngOnInit(): void {
    this.logger.debug(`admin-security-info.component.ngOnInit | email: ${this.user?.email}`)

    // Check if user is locked out
    if (this.user) {
      const lockoutEnd = this.user.lockoutEnd;
      this.logger.trace(`admin-security-info.component.ngOnInit | lockoutEnd: ${lockoutEnd}`);
      const isLockedOut = lockoutEnd && new Date(lockoutEnd) > new Date();
      this.logger.trace(`admin-security-info.component.ngOnInit | isLockedOut: ${isLockedOut}`);
      this.isLockedOut = isLockedOut ?? false;
    }

  }

  onResetAuthenticatorClick() {
    this.logger.debug(`admin-security-info.component.onResetAuthenticatorClick`);

    // Confirm reset
    Swal.fire({
      title: 'Reset Authenticator',
      text: 'Are you sure you want to reset the authenticator app for this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.debug(`admin-security-info.component.onResetAuthenticatorClick: confirmed`);

        // Reset authenticator
        const request: IEmailOnlyRequest = {
          email: this.user.email
        };

        this.accountService.resetAuthenticator(request).then(response => {
          this.logger.trace(`admin-security-info.component.onResetAuthenticatorClick: response:`, response);

          // Confirm success
          Swal.fire({
            title: 'Authenticator Reset',
            icon: 'success'
          });

          this.user.twoFactorEnabled = false;

        }).catch(err => {
          this.logger.error(`admin-security-info.component.onResetAuthenticatorClick: error:`, err);

          Swal.fire({
            title: 'Error',
            text: 'There was an error resetting the authenticator app. Please try again.',
            icon: 'error'
          });

        });
      }
    });
  }

  onResendEmailConfirmationClick() {
    this.logger.debug(`admin-security-info.component.onResendEmailConfirmationClick`);

    // Resend email confirmation
    const request: IEmailOnlyRequest = {
      email: this.user.email
    };
    this.accountService.sendConfirmEmail(request).then(response => {
      this.logger.trace(`admin-security-info.component.onResendEmailConfirmationClick: response:`, response);

      // Confirm success
      Swal.fire({
        title: 'Verification Email Sent',
        icon: 'success'
      });

    }).catch(err => {
      this.logger.error(`admin-security-info.component.onResendEmailConfirmationClick: error:`, err);

      Swal.fire({
        title: 'Error',
        text: 'There was an error sending the email confirmation. Please try again.',
        icon: 'error'
      });

    });

  }

  onResendSetupLinkClick() {
    this.logger.debug(`admin-security-info.component.onResendSetupLinkClick`);

    // Resend setup link
    const request: IForgotPasswordRequest = {
      email: this.user.email
    };
    this.accountService.sendForgotPassword(request).then(response => {
      this.logger.trace(`admin-security-info.component.onResendSetupLinkClick: response:`, response);

      // Confirm success
      Swal.fire({
        title: 'Setup Link Sent',
        icon: 'success'
      });

    }).catch(err => {
      this.logger.error(`admin-security-info.component.onResendSetupLinkClick: error:`, err);

      Swal.fire({
        title: 'Error',
        text: 'There was an error sending the setup link. Please try again.',
        icon: 'error'
      });

    });

  }

  onUnlockClick() {
    this.logger.debug(`admin-security-info.component.onUnlockClick`);

    // Confirm unlock
    Swal.fire({
      title: 'Unlock User',
      text: 'Are you sure you want to unlock this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unlock it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.debug(`admin-security-info.component.onUnlockClick: confirmed`);

        // Unlock user
        this.userService.unlock(this.user.id).then(response => {
          this.logger.trace(`admin-security-info.component.onUnlockClick: response:`, response);

          // Confirm success
          Swal.fire({
            title: 'User Unlocked',
            icon: 'success'
          });

          this.isLockedOut = false;

        }).catch(err => {
          this.logger.error(`admin-security-info.component.onUnlockClick: error:`, err);

          Swal.fire({
            title: 'Error',
            text: 'There was an error unlocking the user. Please try again.',
            icon: 'error'
          });

        });
      }
    });
  }

}
