import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return auth.currentUser()?.role === 'admin'
      ? true
      : router.createUrlTree(['/']);
  }

  return auth.loadCurrentUser().pipe(
    map((user) => user?.role === 'admin' ? true : router.createUrlTree(user ? ['/'] : ['/auth'])),
    catchError(() => of(router.createUrlTree(['/auth']))),
  );
};
