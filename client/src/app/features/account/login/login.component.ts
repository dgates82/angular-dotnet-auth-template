import {Component, OnInit} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';

import { ActivatedRoute, Router } from '@angular/router';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { IAuthRequest } from '@interfaces/account/auth-request';
import {ObfuscateEmailPipe} from "@core/pipes/obfuscate-email.pipe";
import {ObfuscatePhonePipe} from "@core/pipes/obfuscate-phone.pipe";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [ObfuscateEmailPipe, ObfuscatePhonePipe]
})
export class LoginComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly formBuilder: FormBuilder,
              private readonly obfuscateEmailPipe: ObfuscateEmailPipe,
              private readonly obfuscatePhonePipe: ObfuscatePhonePipe) { }

  private returnUrl: string = '';

  allowSelfRegister: boolean = Constants.allowSelfRegister;

  isSubmitting: boolean = false;
  isInvalidLogin = false;
  errorMessage: string = '';
  subtitle: string = 'Enter your details to get started.'

  is2FaRequired: boolean = Constants.is2FaRequired;
  is2FaEnabled: boolean = false;
  twoFactorMethod: string = '';

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get email(): any {
    return this.loginForm.get('email');
  }

  get password(): any {
    return this.loginForm.get('password')
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

      this.onLoginResponse(response).then(() => {});

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

      if (!response.requiresTwoFactor && this.is2FaRequired) {
        this.logger.trace(`account.onLoginResponse | 2fa required but not enabled`);
        // Route user to configure 2fa
        this.router.navigate(['/enable2fa', this.email.value]);
        return;
      }
      this.isInvalidLogin = false;

      // Set login token
      localStorage.setItem("authResponse", JSON.stringify(response));
      this.accountService.sendAuthStateChangeNotification(true);

      // Test secure endpoint
      this.accountService.testSecure().then(secureResponse => {
        this.logger.debug(`account.login | secureResponse: ${secureResponse}`);
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
