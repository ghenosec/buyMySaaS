import { AnalyticsEventType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AnalyticsEventDto {
  @IsUUID() saasId!: string;
  @IsEnum(AnalyticsEventType) type!: AnalyticsEventType;
  @IsOptional() @IsString() @MaxLength(500) referrer?: string;
}
