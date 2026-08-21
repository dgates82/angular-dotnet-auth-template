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

  // Only meaningful when is2FaRequired is false - is2FaRequired: true has its own,
  // separate forced-setup flow that this doesn't affect either way.
  public static show2FaBanner = environment.show2FaBanner;

  public static allowUserEdit = environment.allowUserEdit;

  public static allowSelfRegister = environment.allowSelfRegister;

  public static twoFaMethods = environment.twoFaMethods;

  public static requiredProfileFields = environment.requiredProfileFields;

  public static LocalStorageKeys = {
    sideNavExpanded: 'sideNavExpanded',
    twoFaBannerDismissed: 'twoFaBannerDismissed',
  }

}
