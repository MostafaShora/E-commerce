import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';

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

  @ViewChild('themeMenu') themeMenu?: ElementRef<HTMLDetailsElement>;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (this.themeMenu && !this.themeMenu.nativeElement.contains(target)) {
      this.themeMenu.nativeElement.removeAttribute('open');
    }
  }
}