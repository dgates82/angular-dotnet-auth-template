import { Directive, HostListener } from '@angular/core';

// Put on the mat-icon-button matSuffix inside a password mat-form-field. Exposes
// `hidden` via exportAs so the sibling input's [type] binding and the icon can
// read it, e.g. #pw="appPasswordVisibility" ... [type]="pw.hidden ? 'password' : 'text'".
@Directive({
  selector: '[appPasswordVisibility]',
  exportAs: 'appPasswordVisibility'
})
export class PasswordVisibilityDirective {
  hidden = true;

  @HostListener('click')
  toggle(): void {
    this.hidden = !this.hidden;
  }
}
