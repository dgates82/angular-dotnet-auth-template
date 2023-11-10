import { HttpHeaders } from '@angular/common/http';

export class Constants {

  public static postOptions = {
    headers: new HttpHeaders({
      'content-location': 'application/json'
    })
  }

  public static is2FaRequired = true;

  public static allowUserEdit = false;

}
