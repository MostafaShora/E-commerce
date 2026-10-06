import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideStar } from '@lucide/angular';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-product-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideStar],
  templateUrl: './product-rating.html',
})
export class ProductRatingComponent {
  private readonly language = inject(LanguageService);
  readonly rating = input(0);
  readonly reviewCount = input(0);

  readonly safeReviewCount = computed(() => {
    const count = this.reviewCount();
    return Number.isFinite(count) && count > 0 ? count : 0;
  });
  readonly hasValidRating = computed(() => {
    const rating = this.rating();
    return Number.isFinite(rating) && rating >= 1 && rating <= 5;
  });
  readonly hasRating = computed(() => this.safeReviewCount() > 0 && this.hasValidRating());
  readonly starFillPercentages = computed(() => {
    const rating = this.hasRating() ? this.rating() : 0;
    return Array.from(
      { length: 5 },
      (_, index) => Math.round(Math.max(0, Math.min(1, rating - index)) * 10000) / 100,
    );
  });
  readonly ratingText = computed(() => (this.hasRating() ? this.rating().toFixed(1) : ''));
  readonly accessibleLabel = computed(() => {
    if (this.hasRating()) {
      const count = this.safeReviewCount();
      return this.language.t(count === 1 ? 'productRating.ratedOne' : 'productRating.ratedMany', {
        rating: this.ratingText(),
        count,
      });
    }

    const count = this.safeReviewCount();
    return count > 0
      ? this.language.t('productRating.unavailable', { count })
      : this.language.t('productRating.noReviews');
  });
}
