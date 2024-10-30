import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {Constants} from "@core/constants";
import {AccountService} from "@data/services/account.service";
import {IApplicationUser} from "@interfaces/account/application-user";
import {ActivatedRoute} from "@angular/router";
import {TWO} from "@angular/cdk/keycodes";

@Component({
  selector: 'app-enable-two-fa-root',
  templateUrl: './enable-two-fa-root.component.html',
  styleUrls: ['./enable-two-fa-root.component.scss']
})
export class EnableTwoFaRootComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly route: ActivatedRoute) {
  }

  @Input() email: string = '';
  @Output() twoFaEnabled: EventEmitter<string> = new EventEmitter<string>();

  twoFaMethods: string[] = Constants.twoFaMethods;
  isMultipleMethods: boolean = this.twoFaMethods.length > 1;
  showMethods: boolean = false;

  showEnableTwoFaEmail: boolean = false;
  showEnableTwoFaAuthenticator: boolean = false;
  showEnableTwoFaSms: boolean = false;

  isRouted: boolean = false;

  isTwoFaEnabled: boolean = false;

  ngOnInit() {
    this.logger.debug(`enable-two-fa-root.component.ngOnInit`);

    // Check for email in route
    const email = this.route.snapshot.paramMap.get('email') ?? '';

    this.isRouted = email !== '';

    // If email is passed in, use it
    if (email && !this.email) {
      this.email = email;
    }

    // If more than 1 method, display options to choose from
    if (this.twoFaMethods.length > 1) {
      this.logger.debug(`enable-two-fa-root.component.ngOnInit | Multiple two-factor methods available`);
      this.showMethods = true;
    }
    // Otherwise, display the only method available
    else {
      this.logger.debug(`enable-two-fa-root.component.ngOnInit | Single two-factor method available`);
    }

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

  onBackClicked() {
    this.logger.debug(`enable-two-fa-root.component.onBackClicked`);
    this.showMethods = true;
    this.showEnableTwoFaEmail = false;
    this.showEnableTwoFaAuthenticator = false;
    this.showEnableTwoFaSms = false;
  }

  onTwoFaEnabled(event: string) {
    this.logger.debug(`enable-two-fa-root.component.onTwoFaEnabled | event: ${event}`);
    this.isTwoFaEnabled = event !== '';
    this.twoFaEnabled.emit(event);
  }

  protected readonly Constants = Constants;
}
