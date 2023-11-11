import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';

import { ActivatedRoute, Router } from '@angular/router';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { IAuthRequest } from '@interfaces/account/auth-request';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly route: ActivatedRoute,
    private readonly router: Router) { }

  private returnUrl: string = '';

  allowSelfRegister = Constants.allowSelfRegister;

  isInvalidLogin = false;
  errorMessage: string = '';
  subtitle: string = 'Enter your details to get started.'

  is2FaRequired: boolean = Constants.is2FaRequired;
  is2FaEnabled: boolean = false;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  })

  get email(): any {
    return this.loginForm.get('email');
  }

  get password(): any {
    return this.loginForm.get('password')
  }

  get loginFormControls() {
    return this.loginForm.controls;
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

    if (this.loginForm.invalid) {
      return;
    }

    const authRequest: IAuthRequest = {
      email: this.email.value,
      password: this.password.value
    }

    this.accountService.login(authRequest).then(response => {
      this.logger.trace(`account.login | response:`, response)

      this.onLoginResponse(response);
      
    }).catch(error => {
      // Display failed login message to user
      this.logger.debug('account.login error response: ', error);
      this.isInvalidLogin = true;
      this.accountService.sendAuthStateChangeNotification(false);
      this.errorMessage = 'Invalid login. Please try again';

    });
  }

  onLoginResponse(response: IAuthResponse) {
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
      // localStorage.setItem("token", response.token ?? "");
      localStorage.setItem("authResponse", JSON.stringify(response));        
      this.accountService.sendAuthStateChangeNotification(true);

      // Test secure endpoint
      this.accountService.testSecure().then(secureRespose => {
        this.logger.debug(`account.login | secureResponse: ${secureRespose}`);
      });

      // Redirect to return url
      this.router.navigate([this.returnUrl]);

    } else if (response.requiresTwoFactor) {        
      this.logger.debug(`account.login | 2fa required`);
      // Display 2fa auth form
      this.is2FaEnabled = true;
      this.subtitle = "Enter code from authenticator app to continue."

      // Clear any errors
      this.isInvalidLogin = false;
      this.errorMessage = '';


    } else {
      this.isInvalidLogin = true;
      this.accountService.sendAuthStateChangeNotification(false);
      // this.errorMessage = 'Invalid login. Please try again';
      this.errorMessage = response.errorMessage ?? 'Invalid login. Please try again';
    }
  }

}
