import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {AccountService} from "@data/services/account.service";
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {IApplicationUser} from "@interfaces/account/application-user";
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-enable-two-fa-phone',
    templateUrl: './enable-two-fa-phone.component.html',
    styleUrls: ['./enable-two-fa-phone.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, NgxMaskDirective, MatError, MatButton]
})
export class EnableTwoFaPhoneComponent implements OnInit{
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);


  @Input() email = '';
  @Input() showBack = false;
  @Input() isRouted = false;

  @Output() backClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() twoFaEnabled: EventEmitter<string> = new EventEmitter<string>();

  isVerified = false;

  user!: IApplicationUser;

  isCodeSent = false;

  errorMessage = '';

  ngOnInit() {
    this.logger.debug(`enable-two-fa-phone.component.ngOnInit | email: ${this.email} | isRouted: ${this.isRouted}`);

    // Only try to get user info if the user is already logged in
    if (!this.isRouted) {
      this.accountService.getUserByEmail(this.email).then(response => {
        this.logger.trace(`enable-two-fa-phone.component.ngOnInit | response:`, response)
        this.user = response;
        // set phone number
        this.verifyPhoneForm.get('phoneNumber')?.setValue(response.phoneNumber ?? '');
      }).catch(err => {
        this.logger.error(`enable-two-fa-phone.component.ngOnInit | Failed to load user:`, err);
      });
    }
  }

  verifyPhoneForm = new FormGroup({
    code: new FormControl('', [Validators.required]),
    phoneNumber: new FormControl('', [Validators.required])
  });

  get code(): FormControl {
    return this.verifyPhoneForm.get('code') as FormControl;
  }

  get phoneNumber(): FormControl {
    return this.verifyPhoneForm.get('phoneNumber') as FormControl;
  }

  async sendCode() {
    this.logger.debug(`enable-two-fa-phone.component.sendCode | phone number: ${this.phoneNumber?.value}`);

    // Check for phone number
    if (!this.phoneNumber?.value) {
      this.logger.error(`enable-two-fa-phone.component.sendCode | phone number is required`);
      return;
    }

    const request = {
      email: this.email,
      phoneNumber: this.phoneNumber.value,
      method: 'Sms'
    }

    try {
      await this.accountService.sendTwoFaCode(request);
      this.isCodeSent = true;
    } catch (err) {
      this.logger.error(`enable-two-fa-phone.component.sendCode | error:`, err);
      this.errorMessage = 'Could not send a verification code. Please try again.';
    }

  }

  verifyCode() {
    this.logger.debug(`enable-two-fa-phone.component.verifyCode | code: ${this.code?.value}`);

    const request = {
      email: this.email,
      phoneNumber: this.phoneNumber.value,
      method: 'Sms',
      code: this.code?.value
    };

    this.accountService.verifyAuthenticator(request).then(response => {
      this.logger.trace(`enable-two-fa-phone.component.verifyCode | response:`, response);

      if (response.isVerified){
        this.isVerified = true;
        this.accountService.updateStoredUser({ phoneNumber: this.phoneNumber.value });
        this.twoFaEnabled.emit('Sms');
      } else {
        this.errorMessage = response.message ?? 'An error occurred';
      }
    }).catch(err => {
      this.logger.error(`enable-two-fa-phone.component.verifyCode | error:`, err);
      this.errorMessage = 'Something went wrong. Please try again.';
    });
  }

  back() {
    this.logger.debug(`enable-two-fa-phone.component.back`);
    this.backClicked.emit();
  }

  resendCode() {
    this.logger.debug(`enable-two-fa-phone.component.resendCode`);

    void this.sendCode();
  }

}
