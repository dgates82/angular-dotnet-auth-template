import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IForgotPasswordRequest } from '@interfaces/account/forgot-password-request';
import { MatCard, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
    imports: [MatCard, MatCardContent, FormsModule, ReactiveFormsModule, MatCardTitle, MatCardSubtitle, MatFormField, MatLabel, MatInput, MatError, MatButton]
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
