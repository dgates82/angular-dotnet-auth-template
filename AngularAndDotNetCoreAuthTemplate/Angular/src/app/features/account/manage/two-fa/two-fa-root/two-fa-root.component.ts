import { Component, OnInit } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import Swal from "sweetalert2";

@Component({
  selector: 'app-two-fa-root',
  templateUrl: './two-fa-root.component.html',
  styleUrls: ['./two-fa-root.component.scss']
})
export class TwoFaRootComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService) { }

  user!: IApplicationUser;

  isTwoFaEnabled: boolean = false;
  // get isTwoFaEnabledString(): string {return this.isTwoFaEnabled ? 'Enabled' : 'Disabled';}
  isTwoFaEnabledString: string = "";

  isTwoFaEnabling: boolean = false;

  ngOnInit(): void {

    this.getUserInfo();

  }

  getUserInfo() {
    // Get user info
    // HACK: Should this be done in the parent and passed in?
    const applicationUser = this.accountService.getAuthResponse()?.user;
    if (applicationUser) {
      this.accountService.getUserByEmail(applicationUser?.email).then(response => {
        this.logger.trace(`two-fa-root.component.ngOnInit | response:`, response)
        this.user = response;
        this.isTwoFaEnabled = response.twoFactorEnabled;
        this.isTwoFaEnabledString = this.isTwoFaEnabled ? 'Enabled' : 'Disabled';
      });
    }
  }

  onEnabledChanged(event: any) {
    this.logger.debug(`two-fa-root.component.onEnabledChanged | value: ${event.checked}`);
    const isTwofaEnabled = event.checked;

    // TODO: Why does this sometimes go back to disabled?

    if (isTwofaEnabled) {
      // Open component to enable 2fa
      this.isTwoFaEnabled = isTwofaEnabled;
      this.isTwoFaEnabledString = "Enabling..."
      this.isTwoFaEnabling = true;
    } else {

      if (this.user?.twoFactorEnabled) {
        // SWAL confirmation to disable 2fa
        Swal.fire({
          title: 'Are you sure?',
          text: 'You are about to disable Two Factor Authentication. This will make your account less secure. Are you sure you want to do this?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, disable it!',
          cancelButtonText: 'No, keep it'
        }).then((result) => {
          if (result.isConfirmed) {
            this.logger.debug(`two-fa-root.component.onEnabledChanged | Disabling 2fa`);
            this.isTwoFaEnabled = false;
            this.isTwoFaEnabling = false;
            this.isTwoFaEnabledString = "Disabled";
            const request = {
              email: this.user.email
            }
            this.accountService.resetAuthenticator(request).then(() => {});
          } else {
            this.logger.debug(`two-fa-root.component.onEnabledChanged | Cancelled disabling 2fa`);
            // TODO: Why doesn't this set the toggle back to true?
            this.isTwoFaEnabled = true;
          }
        });


      } else {
        // User was enabling and cancelled
        this.isTwoFaEnabling = false;
        this.isTwoFaEnabled = isTwofaEnabled;
        this.isTwoFaEnabledString = "Disabled";
      }

    }
  }

  onAuthenticatorEnabled(event: string) {
    this.logger.debug(`two-fa-root.component.onAuthenticatorEnabled | event: ${event}`);
    // this.isTwoFaEnabling = false;
    this.isTwoFaEnabled = true;
    this.isTwoFaEnabledString = this.isTwoFaEnabled ? 'Enabled' : 'Disabled';

  }

}

