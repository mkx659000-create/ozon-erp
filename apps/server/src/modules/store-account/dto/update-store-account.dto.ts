import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateStoreAccountDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  ozonClientId?: string;

  @IsOptional()
  @IsString()
  ozonApiKey?: string;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;
}
