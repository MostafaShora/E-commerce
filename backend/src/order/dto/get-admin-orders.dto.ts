import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { ORDER_STATUS_VALUES } from '../../common/constants/enums';

import type { OrderStatus } from '../../common/constants/enums';

export class GetAdminOrdersDto {
  @IsOptional()
  @IsEnum(ORDER_STATUS_VALUES)
  status?: OrderStatus;

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
  limit = 10;
}
