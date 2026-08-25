import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AIAdminAction {
  REPHRASE_TITLE = 'rephrase-title',
  GENERATE_DESC = 'generate-desc',
}

export class GenerateAIAdminDto {
  @IsEnum(AIAdminAction)
  action: AIAdminAction;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
