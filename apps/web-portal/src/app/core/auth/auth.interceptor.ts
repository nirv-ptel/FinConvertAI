import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthUtils } from './auth.utils';

/**
 * Intercept HTTP requests and add Authorization header.
 * Catches 401 responses and signs out the user.
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.accessToken;
  const tenantId = authService.tenantId;

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', 'Bearer ' + token);
  }
  if (tenantId) {
    headers = headers.set('x-tenant-id', tenantId);
  }

  const reqWithAuth = (token || tenantId) ? req.clone({ headers }) : req;

  return next(reqWithAuth).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.signOut();
        location.reload();
      }
      return throwError(() => error);
    })
  );
};
