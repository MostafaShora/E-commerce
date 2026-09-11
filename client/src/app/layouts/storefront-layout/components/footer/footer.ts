import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideCamera, LucideMail, LucideMessageCircle } from '@lucide/angular';

import { LogoComponent } from '../../../../shared/components/logo/logo';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent, LucideMessageCircle, LucideCamera, LucideMail, LucideArrowRight],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
