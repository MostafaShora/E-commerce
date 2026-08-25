import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AIAdminAction {
  REPHRASE_TITLE = 'rephrase-title',
  GENERATE_DESC = 'generate-desc',
}

export class GenerateAIAdminDto {
  @IsEnum(AIAdminAction)
  action: AIAdminAction;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
