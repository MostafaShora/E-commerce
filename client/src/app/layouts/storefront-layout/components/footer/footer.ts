import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../../core/services/language';
import { LogoComponent } from '../../../../shared/components/logo/logo';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  readonly language = inject(LanguageService);
}
