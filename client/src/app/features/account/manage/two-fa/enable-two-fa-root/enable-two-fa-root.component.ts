import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {Constants} from "@core/constants";
import {AccountService} from "@data/services/account.service";
import { ActivatedRoute, Router } from "@angular/router";
import { MatCard } from '@angular/material/card';
import { EnableTwoFaMethodsComponent } from '../enable-two-fa-methods/enable-two-fa-methods.component';
import { EnableAuthenticatorComponent } from '../enable-authenticator/enable-authenticator.component';
import { EnableTwoFaEmailComponent } from '../enable-two-fa-email/enable-two-fa-email.component';
import { EnableTwoFaPhoneComponent } from '../enable-two-fa-phone/enable-two-fa-phone.component';
import Swal from "sweetalert2";

@Component({
    selector: 'app-enable-two-fa-root',
    templateUrl: './enable-two-fa-root.component.html',
    styleUrls: ['./enable-two-fa-root.component.scss'],
    imports: [MatCard, EnableTwoFaMethodsComponent, EnableAuthenticatorComponent, EnableTwoFaEmailComponent, EnableTwoFaPhoneComponent]
})
export class EnableTwoFaRootComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);


  @Input() email = '';
  @Output() twoFaEnabled: EventEmitter<string> = new EventEmitter<string>();

  twoFaMethods: string[] = Constants.twoFaMethods;
  isMultipleMethods: boolean = this.twoFaMethods.length > 1;
  showMethods = false;

  showEnableTwoFaEmail = false;
  showEnableTwoFaAuthenticator = false;
  showEnableTwoFaSms = false;

  isRouted = false;

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
    this.twoFaEnabled.emit(event);

    // Embedded settings-page flow (isRouted false) stays put; its own parent handles the event.
    if (!this.isRouted) {
      return;
    }

    // Notifies the persistent sidenav to recheck twoFaSetupRequired, timed to the /home nav below.
    this.accountService.sendAuthStateChangeNotification(this.accountService.isUserAuthenticated());

    Swal.fire({
      title: 'Two-factor authentication enabled',
      text: 'Your account is now protected with two-factor authentication.',
      icon: 'success',
      heightAuto: false
    });

    this.router.navigate(['/home']);
  }

  protected readonly Constants = Constants;
}
