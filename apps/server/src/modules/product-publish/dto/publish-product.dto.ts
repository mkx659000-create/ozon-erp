import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeDto {
  @IsNumber()
  attributeId: number;

  @IsArray()
  values: Array<{
    dictionary_value_id?: number;
    value: string;
  }>;
}

export class PublishProductDto {
  @IsString()
  storeAccountId: string;

  @IsString()
  name: string;

  @IsString()
  offerId: string;

  @IsNumber()
  descriptionCategoryId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsNumber()
  premiumPrice?: number;

  @IsString()
  currencyCode: string;

  @IsOptional()
  @IsNumber()
  vat?: number;

  @IsOptional()
  @IsNumber()
  weightGross?: number;

  @IsOptional()
  @IsNumber()
  dimensionLength?: number;

  @IsOptional()
  @IsNumber()
  dimensionWidth?: number;

  @IsOptional()
  @IsNumber()
  dimensionHeight?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  primaryImage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];
}

export class BatchPublishDto {
  @IsString()
  storeAccountId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublishProductDto)
  products: PublishProductDto[];
}
