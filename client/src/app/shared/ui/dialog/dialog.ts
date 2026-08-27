import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  templateUrl: './dialog.html',
})
export class DialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() closeOnOutsideClick = true;
  @Output() openChange = new EventEmitter<boolean>();

  @HostListener('document:keydown.escape')
  closeOnEscape(): void { if (this.open) this.close(); }
  close(): void { this.openChange.emit(false); }
  outsideClick(): void { if (this.closeOnOutsideClick) this.close(); }
}
