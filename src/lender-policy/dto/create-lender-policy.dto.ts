import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLenderPolicyDto {
  @IsNotEmpty()
  @IsString()
  lenderId: string;

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
  minLoanAmount: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  maxLoanAmount: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedProfessions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedLocations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedLocations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employmentTypes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxFOIR?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minIncome?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}