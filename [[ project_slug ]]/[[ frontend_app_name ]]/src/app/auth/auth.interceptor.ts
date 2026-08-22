import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  return from(authService.validAccessToken()).pipe(
    switchMap((token) => {
      const authenticatedRequest = token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request;

      return next(authenticatedRequest).pipe(
        catchError((error) => {
          if (error.status !== 401 || !token) {
            return throwError(() => error);
          }

          return from(authService.validAccessToken(true, token)).pipe(
            switchMap((refreshedToken) => refreshedToken
              ? next(request.clone({
                  setHeaders: { Authorization: `Bearer ${refreshedToken}` }
                }))
              : throwError(() => error))
          );
        })
      );
    })
  );
};
