import { IsNotEmpty, IsString } from 'class-validator';

export class GetProductBySlugDto {
  @IsString()
  @IsNotEmpty()
  slug: string;
}
