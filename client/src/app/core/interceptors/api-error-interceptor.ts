import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { normalizeApiError } from '../api/api-error';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const normalized = normalizeApiError(error);
        console.error('API request failed:', normalized);
      }

      return throwError(() => error);
    }),
  );
};
