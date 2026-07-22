import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'obfuscatePhone'
})
export class ObfuscatePhonePipe implements PipeTransform {

  transform(phoneNumber: string): string {
    if (!phoneNumber) {
      return '';
    }
    const lastFourDigits = phoneNumber.slice(-4);
    return '***-***-' + lastFourDigits;
  }

}
