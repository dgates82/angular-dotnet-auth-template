import { Component, Input } from '@angular/core';

import { Constants } from '@core/constants';

import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { UpdatePasswordComponent } from '../../update-password/update-password.component';
import { TwoFaRootComponent } from '../../two-fa/two-fa-root/two-fa-root.component';
import { IApplicationUser } from '@interfaces/account/application-user';

@Component({
    selector: 'app-profile-security-info',
    templateUrl: './profile-security-info.component.html',
    styleUrls: ['./profile-security-info.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, MatButton, UpdatePasswordComponent, TwoFaRootComponent]
})
export class ProfileSecurityInfoComponent {

  // Passed straight through to TwoFaRootComponent - fetched once by
  // ProfileRootComponent instead of independently here.
  @Input() user!: IApplicationUser;

  isUpdatingPassword = false;

  is2FaRequired = Constants.is2FaRequired;

  updatePassword() {
    this.isUpdatingPassword = true;
  }

  onPasswordUpdated() {
    this.isUpdatingPassword = false;
  }

  onPasswordUpdateCancelled() {
    this.isUpdatingPassword = false;
  }

}
