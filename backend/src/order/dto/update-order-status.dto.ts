import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ORDER_STATUS_VALUES } from '../../common/constants/enums';

import type { OrderStatus } from '../../common/constants/enums';

export class UpdateOrderStatusDto {
  @IsEnum(ORDER_STATUS_VALUES)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
