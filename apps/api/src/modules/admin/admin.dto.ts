import { IsString, Length } from 'class-validator';
export class RejectSubmissionDto {
  @IsString() @Length(5, 500) reason!: string;
}
