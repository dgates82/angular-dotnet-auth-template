import { Component, OnInit } from '@angular/core';

import { Constants } from '@core/constants';

import Swal from 'sweetalert2';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { UpdatePasswordComponent } from '../../update-password/update-password.component';
import { TwoFaRootComponent } from '../../two-fa/two-fa-root/two-fa-root.component';

@Component({
    selector: 'app-profile-security-info',
    templateUrl: './profile-security-info.component.html',
    styleUrls: ['./profile-security-info.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, MatButton, UpdatePasswordComponent, TwoFaRootComponent]
})
export class ProfileSecurityInfoComponent implements OnInit {

  constructor() { }

  isUpdatingPassword: boolean = false;

  is2FaRequired = Constants.is2FaRequired;

  ngOnInit(): void {
  }

  updatePassword() {
    this.isUpdatingPassword = true;
  }

  onPasswordUpdated(event: boolean) {
    this.isUpdatingPassword = false;
  }

  onPasswordUpdateCancelled(event: boolean) {
    this.isUpdatingPassword = false;
  }


}
