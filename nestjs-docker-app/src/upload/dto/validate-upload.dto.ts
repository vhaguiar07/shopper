import { ApiProperty } from '@nestjs/swagger';

export class ValidateUploadDto {
  @ApiProperty({
    description: 'Base64 encoded image data',
    example: 'data:image/png;base64,...',
  })
  image: string = '';

  @ApiProperty({
    description: 'Unique code for the customer',
    example: 'CUST1234',
  })
  customer_code: string = '';

  @ApiProperty({
    description: 'Date and time of the measurement in ISO format',
    example: '2024-08-29T14:00:00Z',
  })
  measure_datetime: string = '';

  @ApiProperty({
    description: 'Type of measurement, either WATER or GAS',
    example: 'WATER',
    enum: ['WATER', 'GAS'],
  })
  measure_type: 'WATER' | 'GAS' = 'WATER';
}
