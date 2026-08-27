import { Component, Input } from '@angular/core';

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.html',
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';

  get classes(): string {
    return {
      default: 'bg-slate-900 text-white',
      secondary: 'bg-slate-100 text-slate-700',
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-slate-300 text-slate-700',
    }[this.variant];
  }
}
