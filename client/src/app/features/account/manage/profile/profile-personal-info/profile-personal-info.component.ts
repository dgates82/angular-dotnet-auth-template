import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';
import { faCancel, faEdit, faSave, faUserPlus, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { ProfileFieldValidators } from '@core/validators/profile-field-validators';

import { IApplicationUser } from '@interfaces/account/application-user';
import { IState } from '@interfaces/address/state';
import Swal from 'sweetalert2';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgxMaskDirective } from 'ngx-mask';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-profile-personal-info',
    templateUrl: './profile-personal-info.component.html',
    styleUrls: ['./profile-personal-info.component.scss'],
    imports: [MatCard, MatCardTitle, MatCardContent, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, NgxMaskDirective, MatSelect, MatOption, MatButton, FaIconComponent]
})
export class ProfilePersonalInfoComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly addressService: AddressService,
              private readonly userService: UserService,
              private readonly accountService: AccountService,
              private readonly formBuilder: UntypedFormBuilder) { }

  states!: IState[];

  user: IApplicationUser | null = null;

  isEditMode: boolean = false;

  allowEdit: boolean = Constants.allowUserEdit;

  icons = {
    edit: faEdit,
    cancel: faCancel,
    save: faSave
  }

  profileForm = this.formBuilder.group({
    firstName: ['', ProfileFieldValidators.forField('firstName')],
    lastName: ['', ProfileFieldValidators.forField('lastName')],
    email: ['', [Validators.required]],
    phoneNumber: ['', ProfileFieldValidators.forField('phoneNumber')],
    streetAddress: ['', ProfileFieldValidators.forField('streetAddress')],
    city: ['', ProfileFieldValidators.forField('city')],
    zipCode: ['', ProfileFieldValidators.forField('zipCode')],
    state: ['', ProfileFieldValidators.forField('state')]
  });

  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get email() { return this.profileForm.get('email'); }
  get phoneNumber() { return this.profileForm.get('phoneNumber'); }
  get streetAddress() {return this.profileForm.get('streetAddress'); }
  get city() {return this.profileForm.get('city'); }
  get zipCode() {return this.profileForm.get('zipCode'); }
  get state() {return this.profileForm.get('state'); }

  ngOnInit(): void {
    this.logger.debug(`profile-personal-info.component.ngOnInit`);

    // Get states from address service
    this.addressService.getStates().then(states => {
      this.states = states;
    });

    // Get current user info
    const authUser = this.accountService.getLoggedInUser();
    this.accountService.getUserByEmail(authUser?.email ?? '').then(response => {
      this.user = response;

      this.logger.trace(`profile-personal-info.component.ngOnInit | user:`, this.user)

      this.handleFormState(false);

      if (!this.user) {
        this.logger.debug(`profile-personal-info.component.ngOnInit | user is null`);
        return;
      }

      this.setFormValues();
    });

  }

  setFormValues(): void {
    this.logger.debug(`profile-personal-info.component.setFormValues`)

    if (!this.user) {return;}

    this.logger.trace(`profile-personal-info.component.setFormValues | user:`, this.user)

    this.profileForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phoneNumber: this.user.phoneNumber,
      streetAddress: this.user.streetAddress,
      city: this.user.city,
      zipCode: this.user.zipCode,
      state: this.user.state
    });
  }

  onEditClick() {
    this.logger.trace(`profile-personal-info.component.onEditClick`)
    this.isEditMode = true;
    this.handleFormState(true);
  }

  onCancelClick() {
    this.logger.trace(`profile-personal-info.component.onCancelClick`)
    this.isEditMode = false;
    this.handleFormState(false);

    this.setFormValues();
  }

  async onSaveClick() {
    this.logger.trace(`profile-personal-info.component.onSaveClick`)

    if (this.profileForm.invalid || !this.user) {
      this.logger.debug(`profile-personal-info.component.onSaveClick | profileForm is invalid`);
      return;
    }

    this.logger.trace(`profile-personal-info.component.onSaveClick | form-phone: ${this.phoneNumber?.value} | user-phone: ${this.user.phoneNumber}`);
    // If the phone number has been edited and two factor method is sms prompt user to confirm and disable 2fa
    if (this.user?.phoneNumber !== this.phoneNumber?.value && this.user?.twoFactorMethod === 'Phone') {
      const result = await Swal.fire({
        title: 'Disable Two Factor Authentication',
        text: 'You have changed your phone number. This will disable two factor authentication. Are you sure you want to continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        heightAuto: false
      });

      if (result.isConfirmed) {
        const request = {
          email: this.user.email,
        }
        try {
          await this.accountService.resetAuthenticator(request);
          this.logger.trace(`profile-personal-info.component.onSaveClick | 2fa disabled`);
        } catch (err) {
          this.logger.error(`profile-personal-info.component.onSaveClick | Failed to disable 2fa:`, err);
          Swal.fire({
            title: 'Error',
            text: 'Two-factor authentication could not be disabled. Profile changes were not saved.',
            icon: 'error',
            heightAuto: false
          });
          return;
        }
      } else {
        this.logger.trace(`profile-personal-info.component.onSaveClick | 2fa not disabled`);
        return;
      }
    }

    this.isEditMode = false;
    this.handleFormState(false);

    // Update user
    this.user.firstName = this.firstName?.value;
    this.user.lastName = this.lastName?.value;
    this.user.phoneNumber = this.phoneNumber?.value;
    this.user.streetAddress = this.streetAddress?.value;
    this.user.city = this.city?.value;
    this.user.zipCode = this.zipCode?.value;
    this.user.state = this.state?.value;

    this.userService.update(this.user).then(response => {
      this.logger.trace(`profile-personal-info.component.onSaveClick | response:`, response)

      // Confirmation
      Swal.fire({
        title: 'Profile Updated',
        icon: 'success',
        heightAuto: false
      });

    });
  }

  onZipCodeChange(event: any) {
    this.logger.debug(`profile-personal-info.component.onZipCodeChange | zipCode: ${this.zipCode?.value}`);
    this.addressService.getPlaceByZipCode(this.zipCode?.value).then(zippoResponse => {
      const place = zippoResponse.places[0];
      this.logger.trace(`profile-personal-info.component.onZipCodeChange | place:`, place)
      if (place) {
        this.city?.patchValue(place.placeName);
        this.state?.patchValue(place.stateAbbreviation);
      }
    });
  }

  handleFormState(enableForm: boolean) {
    switch (enableForm) {
      case true:
        this.profileForm.enable();
        break;
      case false:
        this.profileForm.disable();
        break;
    }

    this.email?.disable();
  }

}
