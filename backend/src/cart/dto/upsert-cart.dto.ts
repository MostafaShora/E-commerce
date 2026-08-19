import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @IsString()
  @IsNotEmpty({
    message: 'Product ID is required',
  })
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, {
    message: 'Quantity must be at least 1',
  })
  quantity: number;
}

export class UpsertCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
