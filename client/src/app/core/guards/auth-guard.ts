import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../auth/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  return authService.loadCurrentUser().pipe(
    map((user) => {
      if (user) {
        return true;
      }

      router.navigate(['/auth']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/auth']);
      return of(false);
    }),
  );
};
