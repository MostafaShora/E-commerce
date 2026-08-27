import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.html',
})
export class AvatarComponent {
  @Input() src: string | null | undefined;
  @Input() alt = 'User avatar';
  @Input() fallback = 'U';
  readonly imageFailed = signal(false);

  handleError(): void {
    this.imageFailed.set(true);
  }
}
