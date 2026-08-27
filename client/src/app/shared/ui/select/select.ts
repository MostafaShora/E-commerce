import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SelectOption = { value: string; label: string };

@Component({
  selector: 'app-select',
  standalone: true,
  templateUrl: './select.html',
})
export class SelectComponent {
  @Input() value = '';
  @Input() options: SelectOption[] = [];
  @Input() ariaLabel = 'Select an option';
  @Output() valueChange = new EventEmitter<string>();

  change(value: string): void { this.valueChange.emit(value); }
}
