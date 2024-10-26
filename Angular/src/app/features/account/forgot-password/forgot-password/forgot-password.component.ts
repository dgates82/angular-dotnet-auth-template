import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IForgotPasswordRequest } from '@interfaces/account/forgot-password-request';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly router: Router,
              private readonly formBuilder: FormBuilder) { }

  forgotPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });


  get email(): any {
    return this.forgotPasswordForm.get('email');
  }

  sendPasswordReset() {
    this.logger.debug(`forgot-password.component.sendPasswordReset | email: ${this.email.value}`);

    const forgotPasswordRequest: IForgotPasswordRequest = {
      email: this.email.value
    };

    this.accountService.sendForgotPassword(forgotPasswordRequest).then(response => {
      this.logger.trace(`forgot-password.component.sendPasswordReset | response:`, response)

      // Route user to the forgot password confirmation page
      this.router.navigate(['/forgot-password/confirm']);

    });
  }


  ngOnInit(): void {

  }

}
