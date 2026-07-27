import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';

// Set on a request's HttpContext to opt out of the generic dialog below - for
// calls that already show their own inline/contextual error UI, or that are
// low-stakes enough that a failure shouldn't interrupt the user at all.
export const SKIP_ERROR_DIALOG = new HttpContextToken<boolean>(() => false);

// Fallback net for any request whose error was never otherwise handled: shows
// a generic dialog so a failure is never silent. HttpErrorService still owns
// logging (it runs inside each service's own catchError, downstream of this).
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
