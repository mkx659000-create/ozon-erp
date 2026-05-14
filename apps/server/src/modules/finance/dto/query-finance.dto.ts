import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryFinanceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  storeAccountId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  operationType?: string;

  @IsOptional()
  @IsString()
  postingNumber?: string;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class SyncFinanceDto {
  @IsString()
  storeAccountId: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class RealizationQueryDto {
  @IsString()
  storeAccountId: string;

  @IsString()
  month: string; // "YYYY-MM"
}

export class SummaryQueryDto {
  @IsString()
  storeAccountId: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
