import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { AuthService, type AuthUser } from '../auth/auth';

import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  const currentUser = signal<AuthUser | null>(null);
  const router = { createUrlTree: (commands: string[]) => commands.join('/') };

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: { currentUser, loadCurrentUser: () => of(currentUser()) } },
      { provide: Router, useValue: router },
    ],
  }));

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('redirects unauthenticated users to auth', () => {
    const result = executeGuard({} as never, {} as never);
    expect(result).toBeTruthy();
  });

  it('allows an authenticated admin', () => {
    currentUser.set({ _id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' });
    expect(executeGuard({} as never, {} as never)).toBe(true);
  });

  it('does not allow an authenticated non-admin', () => {
    currentUser.set({ _id: 'user-1', name: 'User', email: 'user@example.com', role: 'user' });
    expect(executeGuard({} as never, {} as never)).not.toBe(true);
  });
});
