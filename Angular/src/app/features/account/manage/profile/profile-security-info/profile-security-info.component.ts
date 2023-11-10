import { Component, OnInit } from '@angular/core';

import { Constants } from '@core/constants';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-security-info',
  templateUrl: './profile-security-info.component.html',
  styleUrls: ['./profile-security-info.component.scss']
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
