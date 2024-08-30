import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class ConfirmMeasureDto {
  @ApiProperty({
    description: 'UUID da medição',
    example: '553a6e3e-6b3e-48fd-8310-f0af5864b43c',
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
