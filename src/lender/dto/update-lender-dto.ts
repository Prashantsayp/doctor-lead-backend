import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

import { Type } from 'class-transformer';

export class UpdateLenderDto {

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(300)
  @Max(900)
  minCibil?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxFoir?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minIncome?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}