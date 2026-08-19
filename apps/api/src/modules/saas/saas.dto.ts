import { ApiProperty, PartialType } from '@nestjs/swagger';
import { BillingInterval, PricingType } from '../../generated/prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSaasDto {
  @ApiProperty() @IsString() @Length(2, 80) name!: string;
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(90)
  slug?: string;
  @IsString() @Length(3, 120) tagline!: string;
  @IsString() @Length(20, 220) shortDescription!: string;
  @IsString() @Length(40, 10_000) description!: string;
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  logoUrl?: string;
  @IsOptional() @IsHexColor() accentColor?: string;
  @IsString() @Length(2, 2) countryCode!: string;
  @IsString() @MaxLength(12) language!: string;
  @IsUrl({ require_protocol: true }) @MaxLength(500) websiteUrl!: string;
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  trialUrl?: string;
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  checkoutUrl?: string;
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  docsUrl?: string;
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  demoUrl?: string;
  @IsEnum(PricingType) pricingType!: PricingType;
  @IsOptional() @IsInt() @Min(0) priceCents?: number;
  @IsString() @Length(3, 3) currency!: string;
  @IsOptional() @IsEnum(BillingInterval) billingInterval?: BillingInterval;
  @IsOptional() @IsString() @MaxLength(60) pricingLabel?: string;
  @IsOptional() @IsBoolean() isBrazilian?: boolean;
  @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) tags!: string[];
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  technologies!: string[];
  @IsArray() @ArrayMaxSize(3) @IsString({ each: true }) categoryIds!: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({ require_protocol: true }, { each: true })
  @MaxLength(500, { each: true })
  screenshotUrls?: string[];
}

export class UpdateSaasDto extends PartialType(CreateSaasDto) {}

export class ExploreQueryDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsEnum(PricingType) pricingType?: PricingType;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  free?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  trial?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  brazilian?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional()
  @IsEnum(['trending', 'recent', 'rating', 'price_asc', 'price_desc'])
  sort: 'trending' | 'recent' | 'rating' | 'price_asc' | 'price_desc' =
    'trending';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 12;
}
