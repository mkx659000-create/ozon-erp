import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EditPromotionProductDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsNumber()
  promoPrice?: number;

  @IsOptional()
  @IsNumber()
  promoDiscount?: number;

  @IsOptional()
  @IsNumber()
  promoStock?: number;
}

export class BatchEditActivityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditPromotionProductDto)
  products: EditPromotionProductDto[];
}

export class JoinPromotionDto {
  @IsString()
  storeAccountId: string;

  @IsArray()
  products: Array<{
    productId: string;
    actionPrice: number;
    stock: number;
  }>;
}

export class ExitPromotionDto {
  @IsString()
  storeAccountId: string;

  @IsArray()
  productIds: string[];
}

export class SyncPromotionDto {
  @IsString()
  storeAccountId: string;
}
