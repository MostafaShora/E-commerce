import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const authenticatedRequest = req.clone({
    withCredentials: true,
  });

  return next(authenticatedRequest);
};
