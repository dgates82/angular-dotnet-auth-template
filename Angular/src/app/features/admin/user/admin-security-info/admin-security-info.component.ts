import { Component, Input, OnInit } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import Swal from 'sweetalert2';
import { IEnableAuthenticatorRequest } from '../../../../interfaces/account/enable-authenticator-request';
import { ISendEmailConfirmRequest } from '../../../../interfaces/account/send-email-confirm-request';

@Component({
  selector: 'app-admin-security-info',
  templateUrl: './admin-security-info.component.html',
  styleUrls: ['./admin-security-info.component.scss']
})
export class AdminSecurityInfoComponent implements OnInit {

  constructor(private readonly logger: LoggerService,    
    private readonly userService: UserService,
    private readonly accountService: AccountService) { }

  @Input() user!: IApplicationUser;

  ngOnInit(): void {
    this.logger.debug(`admin-security-info.component.ngOnInit | email: ${this.user?.email}`)

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
        const request: IEnableAuthenticatorRequest = {
          email: this.user.email
        };

        this.accountService.resetAuthenticator(request).then(response => {
          this.logger.trace(`admin-security-info.component.onResetAuthenticatorClick: response = ${JSON.stringify(response)}`);

          // Confirm success
          Swal.fire({
            title: 'Authenticator Reset',
            icon: 'success'
          });

          this.user.twoFactorEnabled = false;          

        }).catch(err => {          
          this.logger.error(`admin-security-info.component.onResetAuthenticatorClick: error = ${JSON.stringify(err)}`);

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

    // TODO: Should I confirm before sending the email?

    // Resend email confirmation
    const request: ISendEmailConfirmRequest = {
      email: this.user.email
    };
    this.accountService.sendConfirmEmail(request).then(response => {
    this.logger.trace(`admin-security-info.component.onResendEmailConfirmationClick: response = ${JSON.stringify(response)}`);

    // Confirm success
    Swal.fire({
      title: 'Verification Email Sent',
      icon: 'success'
    });

    }).catch(err => {          
      this.logger.error(`admin-security-info.component.onResendEmailConfirmationClick: error = ${JSON.stringify(err)}`);

      Swal.fire({
        title: 'Error',
        text: 'There was an error sending the email confirmation. Please try again.',
        icon: 'error'
      });
      
    });

  }

}
