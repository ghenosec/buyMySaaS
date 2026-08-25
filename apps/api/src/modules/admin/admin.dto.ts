import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ReviewModerationStatus,
  UserRole,
} from '../../generated/prisma/client';

export class RejectSubmissionDto {
  @IsString() @Length(5, 500) reason!: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class ReviewModerationQueryDto {
  @IsOptional() @IsEnum(ReviewModerationStatus) status?: ReviewModerationStatus;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 20;
}
