import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
  Min,
  Max,
  IsInt,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsMongoId()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  discountLabel?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockCount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
