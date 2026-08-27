import { Component, inject } from '@angular/core';

import { ThemeService } from '../../../core/services/theme';

@Component({
  selector: 'app-mode-toggle',
  standalone: true,
  templateUrl: './mode-toggle.html',
})
export class ModeToggleComponent {
  readonly theme = inject(ThemeService);
}