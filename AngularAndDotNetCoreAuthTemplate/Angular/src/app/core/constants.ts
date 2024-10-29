import { HttpHeaders } from '@angular/common/http';

export class Constants {

  public static postOptions = {
    headers: new HttpHeaders({
      'content-location': 'application/json'
    })
  }

  // HACK: Seems like these could be in a config file
  public static is2FaRequired = false;

  public static allowUserEdit = true;

  public static allowSelfRegister = true;

  public static twoFaMethods = ["Email", "Sms", "Authenticator"];
  // public static twoFaMethods = ["Email", "Sms"];

}
