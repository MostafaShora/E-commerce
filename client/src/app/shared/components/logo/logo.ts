import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class LogoComponent {
  readonly language = inject(LanguageService);

  @Input() className = '';
  @Input() to = '/';
  @Input() showText = true;
}