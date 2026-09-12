import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
} from '@angular/core';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-storefront-banner',
  standalone: true,
  imports: [LucideX],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class BannerComponent implements AfterViewInit, OnDestroy {
  private readonly tickerText =
    'Free delivery on orders above $20   |   Farm-fresh produce delivered daily';

  readonly tickerCharacters = Array.from(this.tickerText);

  readonly isVisible = signal(
    sessionStorage.getItem('instant-promo-banner-dismissed') !== 'true',
  );

  @ViewChild('tickerViewport')
  private tickerViewport?: ElementRef<HTMLElement>;

  @ViewChildren('tickerCharacter')
  private tickerCharacterElements?: QueryList<ElementRef<HTMLElement>>;

  private animationFrameId = 0;
  private lastTimestamp = 0;

  private positions: number[] = [];
  private widths: number[] = [];

  private readonly speed = 48;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.initializeTicker();
      this.startAnimation();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
  }

  dismiss(): void {
    sessionStorage.setItem('instant-promo-banner-dismissed', 'true');
    this.isVisible.set(false);

    cancelAnimationFrame(this.animationFrameId);
  }

  private initializeTicker(): void {
    const viewport = this.tickerViewport?.nativeElement;
    const elements = this.tickerCharacterElements?.toArray() ?? [];

    if (!viewport || !elements.length) {
      return;
    }

    /*
     * Measure the actual text as ONE piece first.
     * This preserves the natural spacing between characters.
     */
    const measurement = document.createElement('span');

    const computedStyle = getComputedStyle(elements[0].nativeElement);

    measurement.style.position = 'absolute';
    measurement.style.visibility = 'hidden';
    measurement.style.whiteSpace = 'pre';
    measurement.style.fontFamily = computedStyle.fontFamily;
    measurement.style.fontSize = computedStyle.fontSize;
    measurement.style.fontWeight = computedStyle.fontWeight;
    measurement.style.fontStyle = computedStyle.fontStyle;
    measurement.style.letterSpacing = computedStyle.letterSpacing;

    measurement.textContent = this.tickerText;

    document.body.appendChild(measurement);

    /*
     * Measure every prefix.
     *
     * Example:
     *
     * "F"
     * "Fr"
     * "Fre"
     * "Free"
     *
     * This gives us the natural advance of every character
     * while still keeping every character independently movable.
     */
    const prefixWidths: number[] = [0];

    for (let index = 1; index <= this.tickerText.length; index++) {
      measurement.textContent = this.tickerText.slice(0, index);

      prefixWidths.push(
        measurement.getBoundingClientRect().width,
      );
    }

    document.body.removeChild(measurement);

    this.widths = [];

    for (let index = 0; index < this.tickerText.length; index++) {
      const width =
        prefixWidths[index + 1] - prefixWidths[index];

      this.widths.push(width);
    }

    /*
     * Position every character according to the real
     * text metrics instead of positioning letters with gaps.
     */
    this.positions = prefixWidths.slice(0, -1);

    const textWidth = prefixWidths[prefixWidths.length - 1];
    const viewportWidth = viewport.clientWidth;

    /*
     * Start on the right when the complete text fits.
     * If the text is wider than the viewport, start at 0.
     */
    const startX = Math.max(0, viewportWidth - textWidth);

    this.positions = this.positions.map(
      (position) => position + startX,
    );

    this.renderCharacters(elements);
  }

  private startAnimation(): void {
    this.lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }

      const deltaTime = Math.min(
        timestamp - this.lastTimestamp,
        50,
      );

      this.lastTimestamp = timestamp;

      const movement =
        (this.speed * deltaTime) / 1000;

      this.moveCharacters(movement);

      this.animationFrameId =
        requestAnimationFrame(animate);
    };

    this.animationFrameId =
      requestAnimationFrame(animate);
  }

  private moveCharacters(movement: number): void {
    const viewport = this.tickerViewport?.nativeElement;
    const elements =
      this.tickerCharacterElements?.toArray() ?? [];

    if (!viewport || !elements.length) {
      return;
    }

    const viewportWidth = viewport.clientWidth;

    /*
     * Move ALL characters continuously to the left.
     */
    for (let index = 0; index < this.positions.length; index++) {
      this.positions[index] -= movement;
    }

    /*
     * Find the current right-most character.
     */
    let rightMost = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < this.positions.length; index++) {
      rightMost = Math.max(
        rightMost,
        this.positions[index] + this.widths[index],
      );
    }

    /*
     * When ONE character completely leaves the left side,
     * immediately put THAT SAME character after the
     * right-most character.
     *
     * No duplicated text.
     * No pause.
     * No waiting for the whole sentence.
     */
    for (let index = 0; index < this.positions.length; index++) {
      const characterRight =
        this.positions[index] + this.widths[index];

      if (characterRight <= 0) {
        this.positions[index] = Math.max(
          rightMost,
          viewportWidth,
        );

        rightMost =
          this.positions[index] + this.widths[index];
      }
    }

    this.renderCharacters(elements);
  }

  private renderCharacters(
    elements: ElementRef<HTMLElement>[],
  ): void {
    for (let index = 0; index < elements.length; index++) {
      elements[index].nativeElement.style.transform =
        `translate3d(${this.positions[index]}px, -50%, 0)`;
    }
  }
}