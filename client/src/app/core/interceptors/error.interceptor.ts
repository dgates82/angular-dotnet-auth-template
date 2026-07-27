import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';

// Set on a request's HttpContext to opt out of the generic dialog below.
export const SKIP_ERROR_DIALOG = new HttpContextToken<boolean>(() => false);

// Fallback net so a failed request never fails silently; logging still happens in HttpErrorService.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!req.context.get(SKIP_ERROR_DIALOG)) {
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
          heightAuto: false
        });
      }
      return throwError(() => err);
    })
  );
};
