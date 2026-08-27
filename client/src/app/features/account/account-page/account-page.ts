import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './account-page.html',
})
export class AccountPageComponent {
  readonly auth = inject(AuthService);
}
