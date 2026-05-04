import { IsArray, IsMongoId } from 'class-validator';

export class ConfirmParticipantsDto {
  @IsArray()
  @IsMongoId({ each: true })
  confirmedEmployeeIds: string[];

  @IsArray()
  @IsMongoId({ each: true })
  rejectedEmployeeIds: string[];
}