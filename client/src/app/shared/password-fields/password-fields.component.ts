import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

import { faSquareCheck, faSquareXmark } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgClass, NgTemplateOutlet } from '@angular/common';

// Renders the "new password" + "confirm password" fields and strength
// checklist shared by register, password-reset, and update-password. Reads
// and writes the "newPassword"/"confirmPassword" controls on the nearest
// ancestor <form [formGroup]>, via viewProviders below, rather than owning
// its own FormGroup - the parent still owns validity/submission exactly as
// it did before this was extracted, it just no longer repeats the markup
// and validator wiring.
@Component({
  selector: 'app-password-fields',
  templateUrl: './password-fields.component.html',
  styleUrls: ['./password-fields.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective }
  ],
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatError, NgClass, NgTemplateOutlet, FaIconComponent]
})
export class PasswordFieldsComponent {

  constructor(private readonly controlContainer: ControlContainer) { }

  /** Label for the new-password field. Defaults to "Password" (register/reset); pass "New Password" for the change-password form. */
  @Input() newPasswordLabel: string = 'Password';

  /** Message shown when the new-password field is required but empty. */
  @Input() requiredErrorMessage: string = 'Password is required';

  /** Bootstrap width utility class applied to both mat-form-fields. */
  @Input() fieldWidthClass: string = 'w-75';

  /** Whether the new-password field should have the autofocus attribute. */
  @Input() autofocusNewPassword: boolean = false;

  /** Whether the strength checklist is centered (auth-flow cards) or left-aligned (profile tab). */
  @Input() centered: boolean = true;

  @Output() confirmPasswordEnter: EventEmitter<void> = new EventEmitter<void>();

  icons = {
    invalid: faSquareXmark,
    valid: faSquareCheck
  }

  private get form(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  get newPasswordControl(): AbstractControl {
    return this.form.get('newPassword')!;
  }

  get confirmPasswordControl(): AbstractControl {
    return this.form.get('confirmPassword')!;
  }

  get requiredValid(): boolean {
    return !this.newPasswordControl.hasError('required');
  }

  get minLengthValid(): boolean {
    return !this.newPasswordControl.hasError('minlength');
  }

  get requiresDigitValid(): boolean {
    return !this.newPasswordControl.hasError('requiresDigit');
  }

  get requiresUppercaseValid(): boolean {
    return !this.newPasswordControl.hasError('requiresUppercase');
  }

  get requiresLowercaseValid(): boolean {
    return !this.newPasswordControl.hasError('requiresLowercase');
  }

  get requiresSpecialCharsValid(): boolean {
    return !this.newPasswordControl.hasError('requiresSpecialChars');
  }

  get passwordsMatchValid(): boolean {
    return !this.form.hasError('mismatch');
  }
}
