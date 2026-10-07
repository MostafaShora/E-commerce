import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountLayout } from './account-layout';

describe('AccountLayout', () => {
  let component: AccountLayout;
  let fixture: ComponentFixture<AccountLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps all account links, Storefront, and Logout in mobile navigation', () => {
    fixture.detectChanges();

    const navs = fixture.nativeElement.querySelectorAll('nav');
    const mobileNav = navs[navs.length - 1] as HTMLElement;
    const links = Array.from(mobileNav.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(links).toEqual(['/account', '/account/orders', '/account/reviews', '/account/addresses', '/']);
    expect(mobileNav.querySelector('button[aria-label]')).toBeTruthy();
  });
});
