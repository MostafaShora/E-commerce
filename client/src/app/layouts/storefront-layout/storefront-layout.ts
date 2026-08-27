import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BannerComponent } from './components/banner/banner';
import { FooterComponent } from './components/footer/footer';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer';
import { AuthDialogComponent } from '../../shared/components/auth-dialog/auth-dialog';
import { StorefrontNavComponent } from './components/nav/nav';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterOutlet, BannerComponent, StorefrontNavComponent, FooterComponent, CartDrawerComponent, AuthDialogComponent],
  templateUrl: './storefront-layout.html',
})
export class StorefrontLayout {}
