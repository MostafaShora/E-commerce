import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export type AppNotification = {
	id: number;
	kind: NotificationKind;
	message: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
	readonly notifications = signal<AppNotification[]>([]);
	private nextId = 0;

	success(message: string): void {
		this.add('success', message);
	}

	error(message: string): void {
		this.add('error', message);
	}

	info(message: string): void {
		this.add('info', message);
	}

	dismiss(id: number): void {
		this.notifications.update((items) => items.filter((item) => item.id !== id));
	}

	private add(kind: NotificationKind, message: string): void {
		const id = this.nextId++;
		this.notifications.update((items) => [...items, { id, kind, message }]);
		setTimeout(() => this.dismiss(id), 4000);
	}
}
