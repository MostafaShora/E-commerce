import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
	readonly mode = signal<ThemeMode>(this.readMode());
	readonly isDark = signal(false);

	constructor() {
		effect((onCleanup) => {
			const mode = this.mode();
			const mediaQuery =
				typeof window.matchMedia === 'function'
					? window.matchMedia('(prefers-color-scheme: dark)')
					: null;
			const applyTheme = () => {
				const isDark = mode === 'system' ? Boolean(mediaQuery?.matches) : mode === 'dark';
				this.isDark.set(isDark);
				document.documentElement.classList.toggle('dark', isDark);
				document.documentElement.classList.toggle('light', !isDark);
			};

			applyTheme();
			if (mode === 'system' && mediaQuery) {
				mediaQuery.addEventListener('change', applyTheme);
				onCleanup(() => mediaQuery.removeEventListener('change', applyTheme));
			}
			localStorage.setItem('vite-ui-theme', mode);
		});
	}

	toggle(): void {
		this.setTheme(this.isDark() ? 'light' : 'dark');
	}

	setTheme(mode: ThemeMode): void {
		this.mode.set(mode);
	}

	private readMode(): ThemeMode {
		const saved = localStorage.getItem('vite-ui-theme');
		return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system';
	}
}
