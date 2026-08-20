import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import { PAYMENT_METHOD_VALUES } from '../../common/constants/enums';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({
    message: 'Address ID is required',
  })
  addressId: string;

  @IsString()
  @IsIn(PAYMENT_METHOD_VALUES, {
    message: 'Invalid payment method',
  })
  paymentMethod: string;
}
