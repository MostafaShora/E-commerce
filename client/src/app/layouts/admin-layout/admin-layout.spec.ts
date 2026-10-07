import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps all admin links, Storefront, and Logout in mobile navigation', () => {
    fixture.detectChanges();

    const navs = fixture.nativeElement.querySelectorAll('nav');
    const mobileNav = navs[navs.length - 1] as HTMLElement;
    const links = Array.from(mobileNav.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(links).toEqual(['/admin', '/admin/products', '/admin/categories', '/admin/orders', '/']);
    expect(mobileNav.querySelector('button[aria-label]')).toBeTruthy();
  });
});
