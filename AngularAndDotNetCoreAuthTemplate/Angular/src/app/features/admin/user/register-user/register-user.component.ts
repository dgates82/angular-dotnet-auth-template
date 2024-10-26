import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';

import { IApplicationUser } from '@interfaces/account/application-user';
import { IState } from '@interfaces/address/state';
import Swal from 'sweetalert2';

import { faCancel, faEdit, faSave, faUserPlus, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { ISendEmailConfirmRequest } from '@interfaces/account/send-email-confirm-request';
import { AccountService } from '@data/services/account.service';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss']
})
export class RegisterUserComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly addressService: AddressService,
              private readonly userService: UserService,
              private readonly accountService: AccountService,
              private readonly formBuilder: FormBuilder,
              private readonly router: Router) { }

  states!: IState[];

  icons = {
    save: faSave,
    cancel: faCancel
  }

  newUserForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    streetAddress: ['', [Validators.required]],
    city: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    state: ['', [Validators.required]],
    isAdmin: false
  });

  get firstName() { return this.newUserForm.get('firstName'); }
  get lastName() { return this.newUserForm.get('lastName'); }
  get email() { return this.newUserForm.get('email'); }
  get phoneNumber() { return this.newUserForm.get('phoneNumber'); }
  get streetAddress() {return this.newUserForm.get('streetAddress'); }
  get city() {return this.newUserForm.get('city'); }
  get zipCode() {return this.newUserForm.get('zipCode'); }
  get state() {return this.newUserForm.get('state'); }
  get isAdmin() {return this.newUserForm.get('isAdmin'); }

  ngOnInit(): void {
    this.logger.debug(`register-user.component.ngOnInit`);

    this.addressService.getStates().then(states => {
      this.logger.trace(`register-user.component.ngOnInit | states:`, states);
      this.states = states;
    });
  }

  onZipCodeChange(event: any): void {
    this.logger.debug(`register-user.component.onZipCodeChange | zipCode: ${this.zipCode?.value}`);
    this.addressService.getPlaceByZipCode(this.zipCode?.value ?? '').then(zippoResponse => {
      const place = zippoResponse.places[0];
      this.logger.trace(`register-user.component.onZipCodeChange | place:`, place)
      if (place) {
        this.city?.patchValue(place.placeName);
        this.state?.patchValue(place.stateAbbreviation);
      }
    });
  }

  onCancelClick(): void {
    this.logger.debug(`register-user.component.onCancelClick`);
    // Confirm cancel
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to cancel this user registration?',
      icon: 'warning',
      showCancelButton: true,
      heightAuto: false,
      confirmButtonText: 'Yes, Go Back'
    }).then(result => {
      if (result.isConfirmed) {
        this.logger.trace(`register-user.component.onCanceClick | confirmed`);
        // Go back to user list
        this.router.navigate(['/admin/users']);
      }
    });
  }

  onSaveClick(): void {
    this.logger.debug(`register-user.component.onSaveClick`);

    if (this.newUserForm.invalid) {
      return;
    }

    // Save user
    const user: IApplicationUser = {
      firstName: this.firstName?.value ?? '',
      lastName: this.lastName?.value ?? '',
      email: this.email?.value ?? '',
      phoneNumber: this.phoneNumber?.value ?? '',
      streetAddress: this.streetAddress?.value ?? '',
      city: this.city?.value ?? '',
      zipCode: this.zipCode?.value ?? '',
      state: this.state?.value ?? '',
      isAdmin: this.isAdmin?.value ?? false,

      // Unused properties
      id: '',
      emailConfirmed: false,
      twoFactorEnabled: false,
      hasSetPassword: false,
      isActive: true

    };

    this.userService.createUser(user).then(response => {
      this.logger.trace(`register-user.component.onSaveClick | response:`, response);

      this.onUserCreatedSuccess(response);

    }).catch(error => {
      this.logger.error(`register-user.component.onSaveClick | error:`, error);

      // Display error
      Swal.fire({
        title: 'Error',
        text: 'There was an error creating the user',
        icon: 'error',
        heightAuto: false
      });
    });

  }

  onUserCreatedSuccess(response: IApplicationUser): void {
    // HACK: Should the create method return a IResponse so we can check isSuccess?

    // Confirm
    Swal.fire({
      title: 'User created',
      icon: 'success',
      heightAuto: false
    });

    // Send email confirmation
    const request: ISendEmailConfirmRequest = {
      email: response.email
    };
    this.accountService.sendConfirmEmail(request).then(response => {
      this.logger.trace(`register-user.component.onSaveClick | response:`, response);
      if (!response.isSuccess) {
        this.logger.error(`register-user.component.onSaveClick | error: ${response.message}`);
        Swal.fire({
          title: 'Error',
          text: 'There was an error sending the email confirmation. Please resend',
          icon: 'error'
        });
      }
    }).catch(error => {
      this.logger.error(`register-user.component.onSaveClick | error:`, error);
      Swal.fire({
        title: 'Error',
        text: 'There was an error sending the email confirmation. Please resend',
        icon: 'error'
      });
    });

    // Route to list
    this.router.navigate(['/admin/users']);
  }

}
