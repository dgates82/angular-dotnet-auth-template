import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {LoggerService} from "@core/services/logger.service";
import {Constants} from "@core/constants";

interface AuthMethod {
  label: string;
  value: string;
  description: string;
  recommended?: boolean;
}

@Component({
  selector: 'app-enable-two-fa-methods',
  templateUrl: './enable-two-fa-methods.component.html',
  styleUrls: ['./enable-two-fa-methods.component.scss']
})
export class EnableTwoFaMethodsComponent implements OnInit{

  constructor(private readonly logger: LoggerService) {
  }

  @Output() methodSelected: EventEmitter<string> = new EventEmitter<string>();

  selectedMethod: string = 'Authenticator';

  allowedMethods: string[] = Constants.twoFaMethods;

  authMethods: AuthMethod[] = [
    { label: 'Authentication App', value: 'Authenticator', description: 'Get codes from an app like Microsoft Authenticator or Google Authenticator.', recommended: true },
    { label: 'SMS', value: 'Sms', description: 'Receive a unique code via SMS' },
    { label: 'Email', value: 'Email', description: 'Receive a unique code via email' }
  ];

  ngOnInit() {
    this.logger.debug(`enable-two-fa-methods.component.ngOnInit`);

    // filter list on allowed methods
    this.authMethods = this.authMethods.filter(m => this.allowedMethods.includes(m.value));

  }
  selectMethod(value: string) {
    this.logger.debug(`enable-two-fa-methods.component.onSelectMethod | value: ${value}`);
    this.selectedMethod = value;
  }

  next() {
    this.logger.debug(`enable-two-fa-methods.component.onNext | selectedMethod: ${this.selectedMethod}`);
    this.methodSelected.emit(this.selectedMethod);
  }


}
