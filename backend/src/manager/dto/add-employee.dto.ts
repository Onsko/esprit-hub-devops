import { IsMongoId, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class AddEmployeeDto {
  @IsMongoId()
  employeeId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}