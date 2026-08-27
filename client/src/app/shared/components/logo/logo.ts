import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class LogoComponent {
  @Input() className = '';
  @Input() to = '/';
  @Input() showText = true;
}