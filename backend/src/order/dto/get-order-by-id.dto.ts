import { IsNotEmpty, IsString } from 'class-validator';

export class GetOrderByIdDto {
  @IsString()
  @IsNotEmpty({
    message: 'Order ID is required',
  })
  id: string;
}
