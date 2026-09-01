import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ThemeService } from '../../../core/services/theme';

@Component({
  selector: 'app-mode-toggle',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './mode-toggle.html',
})
export class ModeToggleComponent {
  readonly theme = inject(ThemeService);
}