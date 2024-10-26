import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IEnableAuthenticatorRequest } from '@interfaces/account/enable-authenticator-request';
import { IVerifyAuthenticatorRequest } from '@interfaces/account/verify-authenticator-request';
import { Constants } from '@core/constants';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-enable-authenticator',
  templateUrl: './enable-authenticator.component.html',
  styleUrls: ['./enable-authenticator.component.scss']
})
export class EnableAuthenticatorComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly route: ActivatedRoute) { }

  @Input() email: string = '';
  @Output() authenticatorEnabled: EventEmitter<boolean> = new EventEmitter<boolean>();

  is2FaRequired = Constants.is2FaRequired;

  authenticatorUri: string = '';
  sharedKey: string = '';

  errorMessage: string = '';
  isVerified: boolean = false;
  recoveryCodes!: string[] | null;

  verifyAuthenticatorForm = new UntypedFormGroup({
    code: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required])
  })

  get code(): any {
    return this.verifyAuthenticatorForm.get('code');
  }



  ngOnInit(): void {
    this.logger.debug(`enable-authenticator.component.ngOnInit | email: ${this.email}`)

    // If 2fa is required user is routed here. Get email from route params
    if (this.is2FaRequired && !this.email) {
      this.email = this.route.snapshot.paramMap.get('email') ?? '';
    }

    var enableAuthenticatorRequest: IEnableAuthenticatorRequest = {
      email: this.email
    };

    this.accountService.enableAuthenticator(enableAuthenticatorRequest).then(response => {
      this.logger.trace(`enable-authenticator.component.ngOnInit | response:`, response)

      // Load QR code
      this.authenticatorUri = response.authenticatorUri;
      this.sharedKey = response.sharedKey;
    });

  }

  verifyCode(): void {
    this.logger.debug(`enable-authenticator.component.verifyCode`);

    const request: IVerifyAuthenticatorRequest = {
      email: this.email,
      code: this.code.value
    }

    this.accountService.verifyAuthenticator(request).then(response => {
      this.logger.trace(`enable-authenticator.component.verifyCode | response:`, response)

      if (response.isVerified) {
        // Display recovery
        this.isVerified = true;
        this.recoveryCodes = response.codes;
        this.authenticatorEnabled.emit(true);

      } else {
        // Display error message
        this.errorMessage = response.message ?? 'An error occurred';
      }

    });

  }

}
