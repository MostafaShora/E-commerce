import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true }],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = `checkbox-${Math.random().toString(36).slice(2)}`;
  value = false;
  disabled = false;
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean): void { this.value = value === true; }
  registerOnChange(fn: (value: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
  toggle(): void {
    if (this.disabled) return;
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
  }
}
