import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  readonly language = inject(LanguageService);
}
