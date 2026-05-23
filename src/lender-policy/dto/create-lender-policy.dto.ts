import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  Min,
  Max,
  ArrayUnique,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateLenderPolicyDto {

  // AUTO GENERATED FROM BACKEND
  @IsOptional()
  @IsString()
  lenderId?: string;

  @IsNotEmpty()
  @IsString()
  lenderName: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(300)
  @Max(900)
  minCibil: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(300)
  @Max(900)
  maxCibil: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  minLoanAmount: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  maxLoanAmount: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedProfessions?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  allowedLocations?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  blockedLocations?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  employmentTypes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxFOIR?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  roi?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minIncome?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  policyType?: string;
}