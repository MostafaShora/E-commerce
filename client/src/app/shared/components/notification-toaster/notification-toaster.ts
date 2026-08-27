import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-toaster',
  standalone: true,
  templateUrl: './notification-toaster.html',
})
export class NotificationToasterComponent {
  readonly notificationService = inject(NotificationService);
}
