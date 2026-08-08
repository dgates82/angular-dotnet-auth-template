import { Component, OnInit, inject } from '@angular/core';
import { Validators, FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { TwoFaNudgeService } from '@core/services/two-fa-nudge.service';
import { Constants } from '@core/constants';
import { writeAuthResponse } from '@core/auth-storage';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { IAuthRequest } from '@interfaces/account/auth-request';
import {ObfuscateEmailPipe} from "@core/pipes/obfuscate-email.pipe";
import {ObfuscatePhonePipe} from "@core/pipes/obfuscate-phone.pipe";
import { MatCard, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoginTwoFactorComponent } from './login-two-factor/login-two-factor.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    providers: [ObfuscateEmailPipe, ObfuscatePhonePipe],
    imports: [MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardTitle, MatCardSubtitle, MatError, MatFormField, MatLabel, MatInput, MatButton, MatIcon, MatProgressSpinner, RouterLink, LoginTwoFactorComponent]
})
export class LoginComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly twoFaNudgeService = inject(TwoFaNudgeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly obfuscateEmailPipe = inject(ObfuscateEmailPipe);
  private readonly obfuscatePhonePipe = inject(ObfuscatePhonePipe);


  private returnUrl = '';

  allowSelfRegister: boolean = Constants.allowSelfRegister;

  isSubmitting = false;
  isInvalidLogin = false;
  errorMessage = '';
  subtitle = 'Enter your details to get started.'

  is2FaRequired: boolean = Constants.is2FaRequired;
  is2FaEnabled = false;
  twoFactorMethod = '';

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }
  ngOnInit(): void {
    this.logger.debug(`login.component.ngOnInit`)

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // If the user has got here, trigger the auth change to make sure login expiration is checked
    this.accountService.sendAuthStateChangeNotification(false);

    this.logger.debug(`login.component.ngOnInit | returnUrl: ${this.returnUrl}`)
  }

  login() {
    this.logger.info(`User logging in | email: ${this.email.value }`)

    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const authRequest: IAuthRequest = {
      email: this.email.value,
      password: this.password.value
    }

    this.accountService.login(authRequest).then(response => {
      this.logger.trace(`account.login | response:`, response)

      void this.onLoginResponse(response);

    }).catch(error => {
      // Display failed login message to user
      this.logger.debug('account.login error response: ', error);
      this.isInvalidLogin = true;
      this.isSubmitting = false;
      this.accountService.sendAuthStateChangeNotification(false);
      this.errorMessage = 'Invalid login. Please try again';

    });
  }

  async onLoginResponse(response: IAuthResponse) {
    this.logger.debug(`account.onLoginResponse | response:`, response)

    if (response.isAuthSuccessful) {
      this.isInvalidLogin = false;

      // Set login token - must happen before the 2fa-setup-required branch below,
      // since /enable2fa requires an authenticated session to actually enroll a method.
      writeAuthResponse(response);
      this.accountService.sendAuthStateChangeNotification(true);

      if (!response.requiresTwoFactor && this.is2FaRequired) {
        this.logger.trace(`account.onLoginResponse | 2fa required but not enabled`);
        // Route user to configure 2fa
        this.router.navigate(['/enable2fa', this.email.value]);
        return;
      }

      // Not required, so this doesn't block anything - just decides whether the
      // dismissible nudge banner shows on whatever page the user lands on next.
      this.twoFaNudgeService.notifyLoginSuccess(response.requiresTwoFactor);

      // Test secure endpoint
      this.accountService.testSecure().then(secureResponse => {
        this.logger.debug(`account.login | secureResponse: ${secureResponse}`);
      }).catch(err => {
        this.logger.error(`account.login | testSecure error:`, err);
      });

      // Redirect to return url
      this.router.navigate([this.returnUrl]);

    } else if (response.requiresTwoFactor) {
      this.logger.debug(`account.login | 2fa required`);

      // Set 2fa method
      this.logger.debug(`account.login | 2fa method: ${response.twoFactorMethod}`);
      this.twoFactorMethod = response.twoFactorMethod ?? '';

      if (response.twoFactorMethod === 'Email') {
        this.logger.debug(`account.login | send verification code to email`);
        // Send code to email
        await this.accountService.sendTwoFaCode({email: this.email.value, method: 'Email'});

        // Set subtitle
        this.subtitle = `A code has been sent to your email ${this.obfuscateEmailPipe.transform(this.email.value)}. Enter the code to continue.`

      } else if (response.twoFactorMethod === 'Phone') {
        this.logger.debug(`account.login | send verification code to sms`);
        await this.accountService.sendTwoFaCode({email: this.email.value,
          phoneNumber: response.phoneNumber,
          method: 'Sms'});

        // Set subtitle
        this.subtitle = `A code has been sent to your phone number ${this.obfuscatePhonePipe.transform(response.phoneNumber ?? '')}. Enter the code to continue.`

      } else if (response.twoFactorMethod === 'Authenticator') {
        this.logger.debug(`account.login | using authenticator app`);
        // Set subtitle
        this.subtitle = "Enter code from authenticator app to continue."
      }

      // Display 2fa auth form
      this.is2FaEnabled = true;

      // Clear any errors
      this.isInvalidLogin = false;
      this.errorMessage = '';


    } else {
      // Display failed login message to user
      this.isInvalidLogin = true;
      this.isSubmitting = false;
      this.accountService.sendAuthStateChangeNotification(false);
      this.errorMessage = response.errorMessage ?? 'Invalid login. Please try again';
    }
  }

}
