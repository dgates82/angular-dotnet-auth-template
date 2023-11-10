import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { faCancel, faSave, faSquareCheck, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { IChangePasswordRequest } from '@interfaces/account/change-password-request';
import { PasswordValidators } from '@core/validators/password-validators';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly accountService: AccountService) { }

  @Output() passwordUpdated: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() passwordUpdateCancelled: EventEmitter<boolean> = new EventEmitter<boolean>();

  icons = {    
    cancel: faCancel,
    save: faSave,
    invalid: faSquareXmark,
    valid: faSquareCheck
  }

  // HACK: Refactor the password form to its own component to reduce duplication
  passwordUpdateForm = new FormGroup({    
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(8),
      PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), {
        requiresDigit: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), {
        requiresUppercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), {
        requiresLowercase: true
      }),
      PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&_])"), {
        requiresSpecialChars: true
      }),
    ])
    ),
    confirmPassword: new FormControl('', [Validators.required])
  }, {validators: this.validateAreEqual})
  
  get currentPassword(): any {
    return this.passwordUpdateForm.get('currentPassword')
  }

  get newPassword(): any {
    return this.passwordUpdateForm.get('newPassword')
  }

  get newPasswordControl(): AbstractControl {
    return this.passwordUpdateForm.controls['newPassword'];
  }

  get confirmPassword(): any {
    return this.passwordUpdateForm.get('confirmPassword');
  }

  get passwordValid() {  
    return !this.newPasswordControl.valid;
  }

  get requiredValid() {        
    const result = !this.newPasswordControl.hasError('required')    
    return result;    
  }

  get minLengthValid() {    
    return !this.newPasswordControl.hasError('minlength');
  }

  get requiresDigitValid() {
    return !this.newPasswordControl.hasError('requiresDigit');
  }

  get requiresUppercaseValid() {
    return !this.newPasswordControl.hasError('requiresUppercase');
  }

  get requiresLowercaseValid() {
    return !this.newPasswordControl.hasError('requiresLowercase');
  }

  get requiresSpecialCharsValid() {
    return !this.newPasswordControl.hasError('requiresSpecialChars');
  }


  ngOnInit(): void {
  }

  onCancel() {
    this.logger.debug('UpdatePasswordComponent.onCancel()');
    this.passwordUpdateCancelled.emit(true);
  }

  onSubmit() {
    this.logger.debug('UpdatePasswordComponent.onSubmit()');

    if (this.passwordUpdateForm.invalid) {
      this.logger.debug('UpdatePasswordComponent.onSubmit | form invalid');
      return;
    }

    // Update password
    const authResponse = this.accountService.getAuthResponse();

    const request: IChangePasswordRequest = {
      email: authResponse?.user?.email ?? '',
      currentPassword: this.currentPassword.value,
      newPassword: this.newPassword.value,
    };
    this.accountService.changePassword(request).then(response => {
      this.logger.debug(`UpdatePasswordComponent.onSubmit | response: ${JSON.stringify(response)}`);      

      if (response.isSuccess) {
        // SWAL confirmation
        Swal.fire({
          title: 'Password updated',
          text: 'Your password has been updated',
          icon: 'success',
          heightAuto: false
        });

        this.passwordUpdated.emit(true);
        return;
      }

      // Update failed      
      Swal.fire({
          title: 'Password update failed',
          text: 'Your password could not be updated',
          icon: 'error',
          heightAuto: false
        });
    })    
    
   }

   public validateAreEqual(c: AbstractControl): { notSame: boolean } | null {
    return c.value.newPassword === c.value.confirmPassword ? null : { notSame: true };
  }

  public passwordMismatch(): boolean {
    return this.newPassword.touched
      && this.confirmPassword.touched
      && (this.passwordUpdateForm?.errors ? this.passwordUpdateForm.errors['notSame'] : false);
  }

}
