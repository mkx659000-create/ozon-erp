import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProductStatus } from '@prisma/client';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  storeAccountId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
