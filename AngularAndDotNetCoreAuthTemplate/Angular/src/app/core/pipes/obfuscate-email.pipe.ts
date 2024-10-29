import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'obfuscateEmail'
})
export class ObfuscateEmailPipe implements PipeTransform {

  transform(email: string): string {
    if (!email) {
      return '';
    }
    const [username, domain] = email.split('@');
    const obfuscatedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return `${obfuscatedUsername}@${domain}`;
  }

}
