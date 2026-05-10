import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number = 20;
}

export class PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;

  constructor(items: T[], total: number, page: number, pageSize: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }
}
