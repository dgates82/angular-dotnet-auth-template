import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { AccountService } from '@data/services/account.service';
import { Constants } from '@core/constants';
import { faCancel, faEdit, faSave, faUserPlus, faUserTimes } from '@fortawesome/free-solid-svg-icons';

import { IApplicationUser } from '@interfaces/account/application-user';
import { IState } from '@interfaces/address/state';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-personal-info',
  templateUrl: './profile-personal-info.component.html',
  styleUrls: ['./profile-personal-info.component.scss']
})
export class ProfilePersonalInfoComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly addressService: AddressService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly formBuilder: FormBuilder) { }

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
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    streetAddress: ['', [Validators.required]],
    city: ['', [Validators.required]],
    zipCode: ['', [Validators.required]],
    state: ['', [Validators.required]],
    isAdmin: false    
  });

  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
  get email() { return this.profileForm.get('email'); }
  get phoneNumber() { return this.profileForm.get('phoneNumber'); }
  get streetAddress() {return this.profileForm.get('streetAddress'); }
  get city() {return this.profileForm.get('city'); }
  get zipCode() {return this.profileForm.get('zipCode'); }
  get state() {return this.profileForm.get('state'); }
  get isAdmin() {return this.profileForm.get('isAdmin'); }

  ngOnInit(): void {
    this.logger.debug(`profile-personal-info.component.ngOnInit`);

    // Get states from address service
    this.addressService.getStates().then(states => {
      this.states = states;
    });

    // Get current user info
    // TODO: Pulling from the cached user causes the information to not be updated unless the user logs out and back en
    // TODO: Need to either pull this from the API, or update the cached user after saving
    this.user = this.accountService.getLoggedInUser();

    this.handleFormState(false);

    if (!this.user) {
      return;
    }

    this.setFormValues();
  }

  setFormValues(): void {

    if (!this.user) {return;}

    this.profileForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phoneNumber: this.user.phoneNumber,
      streetAddress: this.user.streetAddress,
      city: this.user.city,
      zipCode: this.user.zipCode,
      state: this.user.state,
      isAdmin: this.user.isAdmin
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

  onSaveClick() {
    this.logger.trace(`profile-personal-info.component.onSaveClick`)

    if (this.profileForm.invalid || !this.user) {
      this.logger.debug(`profile-personal-info.component.onSaveClick | profileForm is invalid`);
      return;
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
    this.user.isAdmin = this.isAdmin?.value;       

    this.userService.update(this.user).then(response => {
      this.logger.trace(`profile-personal-info.component.onSaveClick | response: ${JSON.stringify(response)}`)
      
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
      this.logger.trace(`profile-personal-info.component.onZipCodeChange | place: ${JSON.stringify(place)}`)
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
    this.isAdmin?.disable();
  }

}
