import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {AccountService} from "@data/services/account.service";
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {IVerifyAuthenticatorRequest} from "@interfaces/account/verify-authenticator-request";
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-enable-two-fa-email',
    templateUrl: './enable-two-fa-email.component.html',
    styleUrls: ['./enable-two-fa-email.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, NgxMaskDirective, MatError, MatButton]
})
export class EnableTwoFaEmailComponent implements OnInit{

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService) { }

  @Input() email: string = '';
  @Input() showBack: boolean = false;

  @Output() backClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() twoFaEnabled: EventEmitter<string> = new EventEmitter<string>();

  isVerified: boolean = false;

  ngOnInit() {
    this.logger.debug(`enable-two-fa-email.component.ngOnInit | email: ${this.email}`);

    this.sendCode().then(() => {});
  }

  verifyEmailForm = new FormGroup({
    code: new FormControl('', [Validators.required])
  });

  get code(): any {
    return this.verifyEmailForm.get('code');
  }

  async sendCode() {
    this.logger.debug(`enable-two-fa-email.component.sendCode`);

    const request = {
      email: this.email,
      method: 'Email'
    }

    await this.accountService.sendTwoFaCode(request);

  }

  verifyCode() {
    this.logger.debug(`enable-two-fa-email.component.verifyCode | code: ${this.code?.value}`);

    const request: IVerifyAuthenticatorRequest = {
      email: this.email,
      method: 'Email',
      code: this.code?.value
    };

    this.accountService.verifyAuthenticator(request).then(response => {
      this.logger.trace(`enable-two-fa-email.component.verifyCode | response:`, response);

      if (response.isVerified){
        this.isVerified = true;

        this.twoFaEnabled.emit('Email');

      }

    });

  }

  back() {
    this.logger.debug(`enable-two-fa-email.component.back`);
    this.backClicked.emit();
  }

  resendCode() {
    this.logger.debug(`enable-two-fa-email.component.resendCode`);

    this.sendCode().then(() => {});

  }
}
