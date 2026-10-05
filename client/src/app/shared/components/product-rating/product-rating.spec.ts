import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRatingComponent } from './product-rating';

describe('ProductRatingComponent', () => {
  let fixture: ComponentFixture<ProductRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductRatingComponent);
  });

  it.each([
    { label: 'no reviews', rating: 0, count: 0, fills: [0, 0, 0, 0, 0], text: '(0)' },
    { label: 'one review', rating: 5, count: 1, fills: [100, 100, 100, 100, 100], text: '5.0(1)' },
    { label: 'multiple reviews', rating: 4.3, count: 3, fills: [100, 100, 100, 100, 30], text: '4.3(3)' },
    { label: 'half star', rating: 4.5, count: 2, fills: [100, 100, 100, 100, 50], text: '4.5(2)' },
    { label: 'integer rating', rating: 3, count: 8, fills: [100, 100, 100, 0, 0], text: '3.0(8)' },
    { label: 'maximum rating', rating: 5, count: 7, fills: [100, 100, 100, 100, 100], text: '5.0(7)' },
    { label: 'zero rating', rating: 0, count: 0, fills: [0, 0, 0, 0, 0], text: '(0)' },
  ])('renders $label correctly', ({ rating, count, fills, text }) => {
    fixture.componentRef.setInput('rating', rating);
    fixture.componentRef.setInput('reviewCount', count);
    fixture.detectChanges();

    const host = fixture.nativeElement.firstElementChild as HTMLElement;
    const starFills = Array.from(host.querySelectorAll<HTMLElement>('.rating-star-fill'));

    expect(starFills.map((star) => Number.parseFloat(star.style.width) || 0)).toEqual(fills);
    expect(host.textContent?.replace(/\s+/g, '')).toContain(text);
    expect(host.querySelectorAll('.rating-star-outline')).toHaveLength(5);
  });

  it('treats a missing or invalid average as unrated without hiding the count', () => {
    fixture.componentRef.setInput('rating', Number.NaN);
    fixture.componentRef.setInput('reviewCount', 3);
    fixture.detectChanges();

    const host = fixture.nativeElement.firstElementChild as HTMLElement;

    expect(host.textContent?.replace(/\s+/g, '')).toBe('(3)');
    expect(host.getAttribute('aria-label')).toBe('Rating unavailable from 3 reviews');
    expect(
      Array.from(host.querySelectorAll<HTMLElement>('.rating-star-fill')).every(
        (star) => star.style.width === '0%',
      ),
    ).toBe(true);
  });

  it('announces unrated products accessibly', () => {
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.firstElementChild as HTMLElement).getAttribute('aria-label'),
    ).toBe('No reviews yet');
  });
});