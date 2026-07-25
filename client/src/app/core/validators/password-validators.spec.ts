import { FormControl, FormGroup } from '@angular/forms';

import { PasswordValidators } from './password-validators';

describe('PasswordValidators', () => {
  describe('patternValidator', () => {
    const requiresDigit = PasswordValidators.patternValidator(/(?=.*[0-9])/, { requiresDigit: true });

    it('returns null when the pattern matches', () => {
      expect(requiresDigit(new FormControl('abc1'))).toBeNull();
    });

    it('returns the given error when the pattern does not match', () => {
      expect(requiresDigit(new FormControl('abc'))).toEqual({ requiresDigit: true });
    });

    it('returns null for an empty value, leaving "required" to its own validator', () => {
      expect(requiresDigit(new FormControl(''))).toBeNull();
    });
  });

  describe('matchValidator', () => {
    it('returns null when newPassword and confirmPassword match', () => {
      const group = new FormGroup({
        newPassword: new FormControl('Password1!'),
        confirmPassword: new FormControl('Password1!'),
      });

      expect(PasswordValidators.matchValidator(group)).toBeNull();
    });

    it('returns a mismatch error when they differ', () => {
      const group = new FormGroup({
        newPassword: new FormControl('Password1!'),
        confirmPassword: new FormControl('Different1!'),
      });

      expect(PasswordValidators.matchValidator(group)).toEqual({ mismatch: true });
    });

    it('returns null while confirmPassword is still empty', () => {
      const group = new FormGroup({
        newPassword: new FormControl('Password1!'),
        confirmPassword: new FormControl(''),
      });

      expect(PasswordValidators.matchValidator(group)).toBeNull();
    });
  });

  describe('newPasswordValidators', () => {
    const control = () => new FormControl('', PasswordValidators.newPasswordValidators());

    it('is invalid when empty', () => {
      expect(control().valid).toBe(false);
    });

    it('is invalid when missing a required character class', () => {
      const c = control();
      c.setValue('password1'); // no uppercase, no special char
      expect(c.valid).toBe(false);
      expect(c.hasError('requiresUppercase')).toBe(true);
      expect(c.hasError('requiresSpecialChars')).toBe(true);
    });

    it('is valid when all rules are satisfied', () => {
      const c = control();
      c.setValue('Password1!');
      expect(c.valid).toBe(true);
    });
  });
});
