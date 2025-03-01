import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  instructorId: number;
}
