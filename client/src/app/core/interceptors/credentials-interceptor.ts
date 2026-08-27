import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const apiRequest = req.url.startsWith('/api/')
    ? req.clone({ url: `${environment.apiUrl}${req.url.slice(4)}` })
    : req;
  const authenticatedRequest = apiRequest.clone({
    withCredentials: true,
  });

  return next(authenticatedRequest);
};
