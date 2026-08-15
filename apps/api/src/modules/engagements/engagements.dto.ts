import { DealType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() @MaxLength(1200) comment!: string;
}

export class DealDto {
  @IsEnum(DealType) type!: DealType;
  @IsOptional() @IsInt() @Min(0) originalPriceCents?: number;
  @IsOptional() @IsInt() @Min(0) promotionalPriceCents?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) discountPercent?: number;
  @IsOptional() @IsString() @MaxLength(40) couponCode?: string;
  @Type(() => Date) @IsDate() startsAt!: Date;
  @IsOptional() @Type(() => Date) @IsDate() endsAt?: Date;
  @IsOptional() @IsInt() @Min(1) licenseLimit?: number;
  @IsOptional() @IsInt() @Min(0) soldCount?: number;
}
