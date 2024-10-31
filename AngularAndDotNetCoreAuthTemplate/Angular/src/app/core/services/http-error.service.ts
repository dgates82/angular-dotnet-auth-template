import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '@core/services/logger.service';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorService {

  constructor(private readonly logger: LoggerService) { }

  handleError(err: HttpErrorResponse) {
    let errorMessage = '';

    if (err.error instanceof ErrorEvent) {
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }

    this.logger.error("Http error: ", err);
    this.logger.error(errorMessage);

    return throwError(err);

  }

}
