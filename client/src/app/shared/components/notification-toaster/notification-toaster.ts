import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-notification-toaster',
  standalone: true,
  templateUrl: './notification-toaster.html',
})
export class NotificationToasterComponent {
  readonly notificationService = inject(NotificationService);
  readonly language = inject(LanguageService);
}
