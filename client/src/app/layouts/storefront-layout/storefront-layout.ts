import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './storefront-layout.html',
})
export class StorefrontLayout {}
