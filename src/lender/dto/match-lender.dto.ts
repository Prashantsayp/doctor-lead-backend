import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchLenderDto {

  @Type(() => Number)
  @IsNumber()
  @Min(300)
  @Max(900)
  cibil: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  foir: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  income: number;
}