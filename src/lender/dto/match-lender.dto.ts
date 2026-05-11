import { IsNumber, Min } from 'class-validator';

export class MatchLenderDto {

  @IsNumber()
  @Min(0)
  cibil: number;

  @IsNumber()
  @Min(0)
  foir: number;

  @IsNumber()
  @Min(0)
  income: number;
}