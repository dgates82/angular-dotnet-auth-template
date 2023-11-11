import { HttpHeaders } from '@angular/common/http';

export class Constants {

  public static postOptions = {
    headers: new HttpHeaders({
      'content-location': 'application/json'
    })
  }

  public static is2FaRequired = false;

  public static allowUserEdit = true;

  public static allowSelfRegister = true;

}
