import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  templateUrl: './drawer.html',
})
export class DrawerComponent {
  @Input() open = false;
  @Input() side: 'left' | 'right' = 'right';
  @Input() label = 'Panel';
  @Output() openChange = new EventEmitter<boolean>();

  @HostListener('document:keydown.escape')
  closeOnEscape(): void { if (this.open) this.close(); }
  close(): void { this.openChange.emit(false); }
}
