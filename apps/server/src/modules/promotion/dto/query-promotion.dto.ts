import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ParticipationStatus } from '@prisma/client';

export class QueryPromotionDto extends PaginationDto {
  @IsOptional()
  @IsString()
  storeAccountId?: string;

  @IsOptional()
  @IsEnum(ParticipationStatus)
  participationStatus?: ParticipationStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  actionId?: string;
}
