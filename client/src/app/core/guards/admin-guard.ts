import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.authStatus() === 'authenticated') {
    return auth.currentUser()?.role === 'admin'
      ? true
      : router.createUrlTree(['/']);
  }

  return auth.initialize().pipe(
    map(() => auth.authStatus() === 'authenticated'
      ? auth.currentUser()?.role === 'admin'
        ? true
        : router.createUrlTree(['/'])
      : router.createUrlTree(['/auth'])),
  );
};
