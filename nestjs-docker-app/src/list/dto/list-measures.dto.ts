import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListMeasuresDto {
  @ApiPropertyOptional({
    description: 'Tipo de medição (WATER ou GAS)',
    enum: ['WATER', 'GAS'],
    example: 'WATER',
  })
  @IsOptional()
  @IsIn(['WATER', 'GAS'], { message: 'Tipo de medição deve ser WATER ou GAS' })
  measure_type?: string;
}
