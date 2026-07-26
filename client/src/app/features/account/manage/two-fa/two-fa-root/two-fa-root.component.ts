import { Component, OnInit } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import Swal from "sweetalert2";
import {Constants} from "@core/constants";
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { EnableTwoFaRootComponent } from '../enable-two-fa-root/enable-two-fa-root.component';

@Component({
    selector: 'app-two-fa-root',
    templateUrl: './two-fa-root.component.html',
    styleUrls: ['./two-fa-root.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, MatSlideToggle, FormsModule, MatTooltip, MatIcon, MatButton, EnableTwoFaRootComponent]
})
export class TwoFaRootComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService) { }

  user!: IApplicationUser;

  isTwoFaEnabled: boolean = false;
  // get isTwoFaEnabledString(): string {return this.isTwoFaEnabled ? 'Enabled' : 'Disabled';}
  isTwoFaEnabledString: string = "";

  isTwoFaEnabling: boolean = false;

  isTwoFaRequired: boolean = Constants.is2FaRequired;

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
    const isTwoFaEnabled = event.checked;

    if (isTwoFaEnabled) {
      // Open component to enable 2fa
      this.isTwoFaEnabled = isTwoFaEnabled;
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
            const request = {
              email: this.user.email
            }
            this.accountService.resetAuthenticator(request).then(response => {
              this.logger.trace(`two-fa-root.component.onEnabledChanged | response:`, response);
              this.isTwoFaEnabled = false;
              this.isTwoFaEnabling = false;
              this.isTwoFaEnabledString = "Disabled";
            }).catch(err => {
              this.logger.error(`two-fa-root.component.onEnabledChanged | Failed to disable 2fa:`, err);
              this.isTwoFaEnabled = true;
              this.isTwoFaEnabledString = "Enabled";
              Swal.fire({
                title: 'Error',
                text: 'Two-factor authentication could not be disabled. Please try again.',
                icon: 'error',
                heightAuto: false
              });
            });
          } else {
            this.logger.debug(`two-fa-root.component.onEnabledChanged | Cancelled disabling 2fa`);
            this.isTwoFaEnabled = true;
          }
        });


      } else {
        // User was enabling and cancelled
        this.isTwoFaEnabling = false;
        this.isTwoFaEnabled = isTwoFaEnabled;
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

  onChangeTwoFaMethodClick() {
    this.logger.debug(`two-fa-root.component.onChangeTwoFaMethodClick`);
    this.isTwoFaEnabledString = "Updating..."
    this.isTwoFaEnabling = true;
  }
}

