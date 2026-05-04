import { IsMongoId, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class EvaluateCompetenceDto {
  @IsMongoId()
  competenceId: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  hierarchie_eval: number;

  @IsOptional()
  @IsString()
  commentaire?: string;
}