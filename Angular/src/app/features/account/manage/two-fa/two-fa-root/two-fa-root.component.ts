import { Component, OnInit } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-two-fa-root',
  templateUrl: './two-fa-root.component.html',
  styleUrls: ['./two-fa-root.component.scss']
})
export class TwoFaRootComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly userService: UserService) { }

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
        this.logger.trace(`two-fa-root.component.ngOnInit | response: ${JSON.stringify(response)}`)
        this.user = response;
        this.isTwoFaEnabled = response.twoFactorEnabled;
        this.isTwoFaEnabledString = this.isTwoFaEnabled ? 'Enabled' : 'Disabled';
      });
    }
  }

  onEnabledChanged(event: any) {
    this.logger.debug(`two-fa-root.component.onEnabledChanged | value: ${event.checked}`);
    const isTwofaEnabled = event.checked;

    if (isTwofaEnabled) {
      // Open component to enable 2fa
      this.isTwoFaEnabled = isTwofaEnabled;
      this.isTwoFaEnabledString = "Enabling..."
      this.isTwoFaEnabling = true;
    } else {      
      if (this.user?.twoFactorEnabled) {
        // SWAL confirmation to disable 2fa
        Swal.fire({
          title: 'Disable Two-Factor Authentication',
          text: 'Are you sure you want to disable two-factor authentication?',
          icon: 'warning',
          showCancelButton: true,
          heightAuto: false,
          confirmButtonText: 'Yes, disable it!',
        }).then(result => {
          if (result.isConfirmed) {
            this.logger.trace(`two-fa-root.component.onEnabledChanged | confirmed`);
            // Call reset 2fa
            this.accountService.resetAuthenticator({ email: this.user.email }).then(response => {
              this.logger.trace(`two-fa-root.component.onEnabledChanged | response:`, response)
              this.isTwoFaEnabling = false;              
              this.isTwoFaEnabledString = "Disabled";
            })
          } else {
            // User was disabling and cancelled
            this.isTwoFaEnabled = true;
          }
        })
      } else {
        // User was enabling and cancelled
        this.isTwoFaEnabling = false;
        this.isTwoFaEnabled = isTwofaEnabled;
        this.isTwoFaEnabledString = "Disabled";
      }      
      
    }    
  }

  onAuthenticatorEnabled(event: boolean) {
    this.logger.debug(`two-fa-root.component.onAuthenticatorEnabled | event: ${event}`);
    // this.isTwoFaEnabling = false;
    this.isTwoFaEnabled = event;
    this.isTwoFaEnabledString = this.isTwoFaEnabled ? 'Enabled' : 'Disabled';
      
  }

}

