import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
