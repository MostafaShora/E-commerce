import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './button.html',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() routerLink: string | readonly unknown[] | null = null;
  @Output() pressed = new EventEmitter<MouseEvent>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get classes(): string {
    const variants: Record<ButtonVariant, string> = {
      primary: 'inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700',
      secondary: 'inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-200',
      destructive: 'inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700',
      outline: 'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-900',
      ghost: 'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100',
    };
    return `${variants[this.variant]} disabled:cursor-not-allowed disabled:opacity-40`;
  }

  handleClick(event: MouseEvent): void {
    if (!this.isDisabled) {
      this.pressed.emit(event);
    }
  }
}
