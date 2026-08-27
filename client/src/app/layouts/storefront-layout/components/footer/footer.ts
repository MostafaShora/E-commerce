import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LogoComponent } from '../../../../shared/components/logo/logo';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {}