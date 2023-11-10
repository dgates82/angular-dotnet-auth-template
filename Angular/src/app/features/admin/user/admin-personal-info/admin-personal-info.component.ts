import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AddressService } from '@core/services/address.service';
import { UserService } from '@data/services/user.service';
import { faCancel, faEdit, faSave, faUserPlus, faUserTimes } from '@fortawesome/free-solid-svg-icons';

import { IApplicationUser } from '@interfaces/account/application-user';
import { IState } from '@interfaces/address/state';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-personal-info',
  templateUrl: './admin-personal-info.component.html',
  styleUrls: ['./admin-personal-info.component.scss']
})
export class AdminPersonalInfoComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly addressService: AddressService,
    private readonly userService: UserService,
    private readonly formBuilder: FormBuilder) { }

  @Input() user!: IApplicationUser;

  isEditMode: boolean = false;

  states!: IState[];

  icons = {
    edit: faEdit,
    cancel: faCancel,
    save: faSave,
    deactivate: faUserTimes,
    activate: faUserPlus
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
    this.logger.trace(`admin-personal-info.component.ngOnInit | user: ${JSON.stringify(this.user)}`)

    this.addressService.getStates().then(states => {
      this.states = states;
    });

    this.handleFormState(false);

    this.setFormValues();
  }

  setFormValues() {
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
    this.logger.trace(`admin-personal-info.component.onEditClick`)
    this.isEditMode = true;
    this.handleFormState(true);
  }

  onCancelClick() {
    this.logger.trace(`admin-personal-info.component.onCancelClick`)
    this.isEditMode = false;
    this.handleFormState(false);

    this.setFormValues();
  }

  onSaveClick() {
    this.logger.trace(`admin-personal-info.component.onSaveClick`)

    if (this.profileForm.invalid) {
      this.logger.debug(`admin-personal-info.component.onSaveClick | profileForm is invalid`);
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
      this.logger.trace(`admin-personal-info.component.onSaveClick | response: ${JSON.stringify(response)}`)
      
      // Confirmation
      Swal.fire({
        title: 'User Updated',        
        icon: 'success',
        heightAuto: false
      });
      
    });
  }

  onDeactivateClick() {
    this.logger.trace(`admin-personal-info.component.onDeactivateClick`)

    // Confirm
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will deactivate the user',
      icon: 'warning',
      showCancelButton: true,
      heightAuto: false,
      confirmButtonText: 'Yes, deactivate'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.trace(`admin-personal-info.component.onDeactivateClick | confirmed`)

        // Update user
        this.userService.deactivate(this.user.id).then(response => {
          this.logger.trace(`admin-personal-info.component.onDeactivateClick | response: ${JSON.stringify(response)}`)

          this.user.isActive = false;

          // Confirmation
          Swal.fire({
            title: 'User deactivated',
            /*text: 'User has been deactivated',*/
            icon: 'success',
            heightAuto: false
          });

        }).catch(err => {
          this.logger.error(`admin-personal-info.component.onDeactivateClick | error: ${JSON.stringify(err)}`)
          Swal.fire({
            title: 'An error occurred',
            text: 'User could not be deactivated',
            icon: 'error',
            heightAuto: false
          });
        });        
      }
    }); 
  }

  onActivateClick() {
    this.logger.trace(`admin-personal-info.component.onActivateClick`)
    
    // Confirm
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will re-activate the user',
      icon: 'warning',
      showCancelButton: true,
      heightAuto: false,
      confirmButtonText: 'Yes, re-activate'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logger.trace(`admin-personal-info.component.onActivateClick | confirmed`)

        // Update user
        this.userService.activate(this.user.id).then(response => {
          this.logger.trace(`admin-personal-info.component.onActivateClick | response: ${JSON.stringify(response)}`)

          this.user.isActive = true;

          // Confirmation
          Swal.fire({
            title: 'User re-activated',
            /*text: 'User has been re-activated',*/
            icon: 'success',
            heightAuto: false
          });
        }).catch(err => {
          this.logger.error(`admin-personal-info.component.onActivateClick | error: ${JSON.stringify(err)}`)

          Swal.fire({
            title: 'An error occurred',
            text: 'User could not be re-activated',
            icon: 'error',
            heightAuto: false
          });
        })
      }
    });
  }

  onZipCodeChange(event: any) {
    this.logger.debug(`admin-personal-info.component.onZipCodeChange | zipCode: ${this.zipCode?.value}`);
    this.addressService.getPlaceByZipCode(this.zipCode?.value).then(zippoResponse => {
      const place = zippoResponse.places[0];
      this.logger.trace(`admin-personal-info.component.onZipCodeChange | place: ${JSON.stringify(place)}`)
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
