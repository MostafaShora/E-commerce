import { Component } from '@angular/core';

@Component({
  selector: 'app-account-placeholder',
  standalone: true,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-white px-4">
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
        <h1 class="text-2xl font-bold text-slate-900">Account</h1>
        <p class="mt-2 text-slate-600">Authenticated access placeholder for the auth phase.</p>
      </section>
    </main>
  `,
})
export class AccountPlaceholderComponent {}
