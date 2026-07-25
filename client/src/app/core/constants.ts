import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export class Constants {

  public static postOptions = {
    headers: new HttpHeaders({
      'content-location': 'application/json'
    })
  }

  // Feature flags live in environment.ts/environment.prod.ts so a template
  // consumer can toggle them per build without touching component code.
  public static is2FaRequired = environment.is2FaRequired;

  public static allowUserEdit = environment.allowUserEdit;

  public static allowSelfRegister = environment.allowSelfRegister;

  public static twoFaMethods = environment.twoFaMethods;

  public static LocalStorageKeys = {
    sideNavExpanded: 'sideNavExpanded',
  }

}
