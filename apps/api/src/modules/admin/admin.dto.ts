import { IsEnum, IsString, Length } from 'class-validator';
import { UserRole } from '../../generated/prisma/client';

export class RejectSubmissionDto {
  @IsString() @Length(5, 500) reason!: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
