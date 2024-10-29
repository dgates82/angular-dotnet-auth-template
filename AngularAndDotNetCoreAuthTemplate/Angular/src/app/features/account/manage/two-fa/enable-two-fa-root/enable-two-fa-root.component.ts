import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {Constants} from "@core/constants";
import {AccountService} from "@data/services/account.service";
import {IApplicationUser} from "@interfaces/account/application-user";

@Component({
  selector: 'app-enable-two-fa-root',
  templateUrl: './enable-two-fa-root.component.html',
  styleUrls: ['./enable-two-fa-root.component.scss']
})
export class EnableTwoFaRootComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private accountService: AccountService) {
  }

  @Output() twoFaEnabled: EventEmitter<string> = new EventEmitter<string>();

  twoFaMethods: string[] = Constants.twoFaMethods;
  isMultipleMethods: boolean = this.twoFaMethods.length > 1;
  showMethods: boolean = false;

  showEnableTwoFaEmail: boolean = false;
  showEnableTwoFaAuthenticator: boolean = false;
  showEnableTwoFaSms: boolean = false;

  user!: IApplicationUser;

  ngOnInit() {
    this.logger.debug(`enable-two-fa-root.component.ngOnInit`);

    // If more than 1 method, display options to choose from
    if (this.twoFaMethods.length > 1) {
      this.logger.debug(`enable-two-fa-root.component.ngOnInit | Multiple two-factor methods available`);
      this.showMethods = true;
    }
    // Otherwise, display the only method available
    else {
      this.logger.debug(`enable-two-fa-root.component.ngOnInit | Single two-factor method available`);
    }

    this.getUserInfo();

  }

  onMethodSelected($event: string) {
    this.logger.debug(`enable-two-fa-root.component.onMethodSelected | method: ${$event}`);
    this.showMethods = false;
    // Show the selected method
    switch ($event) {
      case 'Email':
        this.showEnableTwoFaEmail = true;
        break;
      case 'Authenticator':
        this.showEnableTwoFaAuthenticator = true;
        break;
      case 'Sms':
        this.showEnableTwoFaSms = true;
        break;
    }
  }

  getUserInfo() {
    // Get user info
    const applicationUser = this.accountService.getAuthResponse()?.user;
    if (applicationUser){
      this.accountService.getUserByEmail(applicationUser?.email).then(response => {
        this.logger.trace(`two-fa-root.component.ngOnInit | response:`, response)
        this.user = response;
      });
    }
  }

  onBackClicked() {
    this.logger.debug(`enable-two-fa-root.component.onBackClicked`);
    this.showMethods = true;
    this.showEnableTwoFaEmail = false;
    this.showEnableTwoFaAuthenticator = false;
    this.showEnableTwoFaSms = false;
  }

  onTwoFaEnabled(event: string) {
    this.logger.debug(`enable-two-fa-root.component.onTwoFaEnabled | event: ${event}`);
    this.twoFaEnabled.emit(event);
  }

}
