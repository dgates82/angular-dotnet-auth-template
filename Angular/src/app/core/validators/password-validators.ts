import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class PasswordValidators {

  constructor() { }

  static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }

      const valid = regex.test(control.value);

      return valid ? null : error;
    }
  }


  // TODO: This method isn't working
  static MatchValidator(control: AbstractControl) {
    const newPassword: string = control.get('newPassword')?.value;
    const confirmPassword: string = control.get('confirmPassword')?.value;

    if (!confirmPassword?.length) {
      return null;
    }

    const confirmPasswordControl = control.get('confirmPassword');

    if (!confirmPasswordControl) {
      return;
    }

    if (newPassword !== confirmPassword) {
      confirmPasswordControl.setErrors({ mismatch: true });
    } else if (confirmPasswordControl.errors && confirmPasswordControl.hasError('mismatch')) {
        delete confirmPasswordControl.errors['mismatch'];
    }

    return null;
  }

}
