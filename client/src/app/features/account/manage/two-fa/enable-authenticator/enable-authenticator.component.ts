import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IEmailOnlyRequest } from '@interfaces/account/email-only-request';
import { IVerifyAuthenticatorRequest } from '@interfaces/account/verify-authenticator-request';
import { Constants } from '@core/constants';
import { ActivatedRoute } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { MatButton } from '@angular/material/button';
import { RecoveryCodesListComponent } from '../recovery-codes-list/recovery-codes-list.component';

@Component({
    selector: 'app-enable-authenticator',
    templateUrl: './enable-authenticator.component.html',
    styleUrls: ['./enable-authenticator.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, QRCodeComponent, MatError, MatFormField, MatLabel, MatInput, NgxMaskDirective, MatButton, RecoveryCodesListComponent]
})
export class EnableAuthenticatorComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly route = inject(ActivatedRoute);


  @Input() email = '';
  @Input() showBack = false;
  @Output() authenticatorEnabled: EventEmitter<string> = new EventEmitter<string>();
  @Output() backClicked: EventEmitter<void> = new EventEmitter<void>();

  is2FaRequired = Constants.is2FaRequired;

  authenticatorUri = '';
  sharedKey = '';

  errorMessage = '';
  isVerified = false;
  recoveryCodes!: string[] | null;

  verifyAuthenticatorForm = new UntypedFormGroup({
    code: new UntypedFormControl('', [Validators.required]),
    password: new UntypedFormControl('', [Validators.required])
  })

  get code(): UntypedFormControl {
    return this.verifyAuthenticatorForm.get('code') as UntypedFormControl;
  }



  ngOnInit(): void {
    this.logger.debug(`enable-authenticator.component.ngOnInit | email: ${this.email}`)

    // If 2fa is required user is routed here. Get email from route params
    if (this.is2FaRequired && !this.email) {
      this.email = this.route.snapshot.paramMap.get('email') ?? '';
    }

    const enableAuthenticatorRequest: IEmailOnlyRequest = {
      email: this.email
    };

    this.accountService.enableAuthenticator(enableAuthenticatorRequest).then(response => {
      this.logger.trace(`enable-authenticator.component.ngOnInit | response:`, response)

      // Load QR code
      this.authenticatorUri = response.authenticatorUri;
      this.sharedKey = response.sharedKey;
    }).catch(err => {
      this.logger.error(`enable-authenticator.component.ngOnInit | Failed to load authenticator setup:`, err);
      this.errorMessage = 'Could not load authenticator setup. Please refresh the page to try again.';
    });

  }

  verifyCode(): void {
    this.logger.debug(`enable-authenticator.component.verifyCode`);

    const request: IVerifyAuthenticatorRequest = {
      email: this.email,
      method: "Authenticator",
      code: this.code.value
    }

    this.accountService.verifyAuthenticator(request).then(response => {
      this.logger.trace(`enable-authenticator.component.verifyCode | response:`, response)

      if (response.isVerified) {
        // Display recovery
        this.isVerified = true;
        this.recoveryCodes = response.codes;
        this.authenticatorEnabled.emit('Authenticator');

      } else {
        // Display error message
        this.errorMessage = response.message ?? 'An error occurred';
      }

    }).catch(err => {
      this.logger.error(`enable-authenticator.component.verifyCode | error:`, err);
      this.errorMessage = 'Something went wrong. Please try again.';
    });

  }

  back() {
    this.logger.debug(`enable-authenticator.component.back`);
    this.backClicked.emit();
  }

}
