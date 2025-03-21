import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @Type(() => Number) // dto outside body need explicit transform
  @IsOptional()
  @IsPositive()
  limit: number;

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  offset: number;
}
