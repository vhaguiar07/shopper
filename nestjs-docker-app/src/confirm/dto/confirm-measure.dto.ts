import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class ConfirmMeasureDto {
  @ApiProperty({
    description: 'UUID da medição',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  measure_uuid!: string;

  @ApiProperty({
    description: 'Valor confirmado',
    example: 123,
  })
  @IsNumber()
  confirmed_value!: number;
}
