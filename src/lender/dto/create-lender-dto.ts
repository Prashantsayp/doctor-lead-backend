import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateLenderDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  minCibil: number;

  @IsNumber()
  @Min(0)
  maxFoir: number;

  @IsNumber()
  @Min(0)
  minIncome: number;
}