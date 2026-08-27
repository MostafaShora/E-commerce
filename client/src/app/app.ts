import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification';
import { NotificationToasterComponent } from './shared/components/notification-toaster/notification-toaster';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationToasterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
  readonly notifications = inject(NotificationService);
}
