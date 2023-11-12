import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { ITwoFaAuthRequest } from '@interfaces/account/two-fa-auth-request';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IAuthResponse } from '@interfaces/account/auth-response';

@Component({
  selector: 'app-login-two-factor',
  templateUrl: './login-two-factor.component.html',
  styleUrls: ['./login-two-factor.component.scss']
})
export class LoginTwoFactorComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService,
    private readonly formBuilder: FormBuilder) { }

  @Input() email: string = '';

  @Output() loginResponse: EventEmitter<IAuthResponse> = new EventEmitter<IAuthResponse>();

  login2FaForm = this.formBuilder.group({
    twoFaCode: ['', [Validators.required,
    Validators.pattern("^[0-9]*$"),
    Validators.minLength(6),
    Validators.maxLength(6)]]
  });

  get twoFaCode(): any {
    return this.login2FaForm.get('twoFaCode');
  }

  @ViewChild("twoFaCodeInput") twoFaCodeInput: ElementRef | undefined;

  ngOnInit(): void {
    this.logger.debug(`login-two-factor.component.ngOnInit | email: ${this.email}`)

  }

ngAfterViewInit() {
    this.logger.debug(`login-two-factor.component.ngAfterViewInit`)    
    this.twoFaCodeInput?.nativeElement.focus();
  }

  login2Fa() {
    this.logger.info(`User logging in with 2fa | email: ${this.email}`)

    if (this.login2FaForm.invalid) {
      this.logger.trace(`login-two-factor.component.login2Fa | Invalid form`)
      return;
    }

    const authRequest: ITwoFaAuthRequest = {
      email: this.email,
      twoFactorCode: this.twoFaCode.value
    }

    this.accountService.login2fa(authRequest).then(response => {
        this.logger.trace(`login-two-factor.component.login2Fa | response:`, response)      

        this.loginResponse.emit(response);

        //if (response.isAuthSuccessful) {
        //  this.logger.trace(`login-two-factor.component.login2Fa | Login successful`)
        //  localStorage.setItem("authResponse", JSON.stringify(response));        
        //  this.accountService.sendAuthStateChangeNotification(true);
        //}
        //else {
        //  this.logger.trace(`login-two-factor.component.login2Fa | Login failed`)
        //  this.accountService.sendAuthStateChangeNotification(false);
        //}
      }      
    );

  }
}

