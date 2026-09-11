import { Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';

import { ThemeService } from '../../../core/services/theme';

@Component({
  selector: 'app-mode-toggle',
  standalone: true,
  imports: [LucideMoon, LucideSun],
  templateUrl: './mode-toggle.html',
})
export class ModeToggleComponent {
  readonly theme = inject(ThemeService);
}
