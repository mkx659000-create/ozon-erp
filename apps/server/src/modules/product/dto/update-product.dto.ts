import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsString()
  categoryName?: string;
}

export class BatchUpdateProductDto {
  productIds: string[];
  updates: UpdateProductDto;
}

export class SyncProductDto {
  @IsString()
  storeAccountId: string;
}
