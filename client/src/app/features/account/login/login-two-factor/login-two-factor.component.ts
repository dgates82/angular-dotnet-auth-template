import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { ITwoFaAuthRequest } from '@interfaces/account/two-fa-auth-request';
import { FormBuilder, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IAuthResponse } from '@interfaces/account/auth-response';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-login-two-factor',
    templateUrl: './login-two-factor.component.html',
    styleUrls: ['./login-two-factor.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, NgxMaskDirective, MatError, MatButton]
})
export class LoginTwoFactorComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly accountService = inject(AccountService);
  private readonly formBuilder = inject(FormBuilder);


  @Input() email = '';
  @Input() twoFactorMethod = '';

  @Output() loginResponse: EventEmitter<IAuthResponse> = new EventEmitter<IAuthResponse>();

  login2FaForm = this.formBuilder.group({
    twoFaCode: ['', [Validators.required,
      Validators.pattern("^[0-9]*$"),
      Validators.minLength(6),
      Validators.maxLength(6)]]
  });

  get twoFaCode(): FormControl {
    return this.login2FaForm.get('twoFaCode') as FormControl;
  }

  @ViewChild("twoFaCodeInput") twoFaCodeInput: ElementRef | undefined;

  ngOnInit(): void {
    this.logger.debug(`login-two-factor.component.ngOnInit | email: ${this.email}`);

    setTimeout(() => {
      this.twoFaCodeInput?.nativeElement.focus();
    }, 100);

  }

  login2Fa() {
    this.logger.info(`User logging in with 2fa | email: ${this.email} | method: ${this.twoFactorMethod}`);

    if (this.login2FaForm.invalid) {
      this.logger.trace(`login-two-factor.component.login2Fa | Invalid form`);
      return;
    }

    const authRequest: ITwoFaAuthRequest = {
      email: this.email,
      twoFactorProvider: this.twoFactorMethod,
      twoFactorCode: this.twoFaCode.value
    }

    this.accountService.login2fa(authRequest).then(response => {
        this.logger.trace(`login-two-factor.component.login2Fa | response:`, response);

        this.loginResponse.emit(response);

      }
    );
  }

  async resendCode() {
    this.logger.debug(`login-two-factor.component.resendCode | email: ${this.email}`);

    const request = {
      email: this.email,
      method: this.twoFactorMethod
    }

    await this.accountService.sendTwoFaCode(request);
  }

}

