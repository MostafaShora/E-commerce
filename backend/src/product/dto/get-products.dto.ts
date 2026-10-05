import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ProductSort {
  BEST_MATCH = 'best-match',
  PRICE_LOW = 'price-low',
  PRICE_HIGH = 'price-high',
  HIGHEST_RATING = 'highest-rating',
}

export class GetProductsDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasDiscount?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || (typeof value === 'string' && !value.trim())
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined || (typeof value === 'string' && !value.trim())
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductSort)
  sort = ProductSort.BEST_MATCH;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
