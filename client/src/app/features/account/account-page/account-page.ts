import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { LanguageService } from '../../../core/services/language';
import { LucideClipboardList, LucideMapPin, LucideStar } from '@lucide/angular';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [RouterLink, LucideClipboardList, LucideMapPin, LucideStar],
  templateUrl: './account-page.html',
})
export class AccountPageComponent {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
}
