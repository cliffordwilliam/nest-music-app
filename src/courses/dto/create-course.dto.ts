import {
  IsString,
  IsInt,
  IsDate,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  instructorId: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
