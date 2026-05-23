import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateLenderDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(300)
  @Max(900)
  minCibil: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxFoir: number;

  @IsNumber()
  @Min(0)
  minIncome: number;

  @IsBoolean()
  isActive: boolean;
}