import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, IsArray } from 'class-validator';
import { ProductStatus } from '@prisma/client';

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

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class BatchUpdateProductDto {
  @IsArray()
  productIds: string[];
  updates: UpdateProductDto;
}

export class SyncProductDto {
  @IsString()
  storeAccountId: string;
}

export class ExportProductDto {
  @IsOptional()
  @IsString()
  storeAccountId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
