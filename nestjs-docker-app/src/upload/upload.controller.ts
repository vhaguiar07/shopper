import { Controller, Post, Body, BadRequestException, ConflictException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { ValidateUploadDto } from './dto/validate-upload.dto';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload de uma imagem e processamento' })
  @ApiBody({
    description: 'Os dados da imagem e detalhes da medição',
    type: ValidateUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Operação realizada com sucesso',
    schema: {
      example: {
        image_url: 'http://example.com/temp-image.png',
        measure_value: 123,
        measure_uuid: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Os dados fornecidos no corpo da requisição são inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma leitura para este tipo no mês atual',
  })
  async uploadImage(@Body() body: ValidateUploadDto) {
    const { image, customer_code, measure_datetime: measureDateStr, measure_type } = body;

    if (!this.uploadService.validateBase64(image)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Os dados da imagem em Base64 são inválidos',
      });
    }

    const measure_datetime = new Date(measureDateStr);
    if (isNaN(measure_datetime.getTime())) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Formato de data inválido',
      });
    }

    if (!['WATER', 'GAS'].includes(measure_type)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Tipo de medição inválido',
      });
    }

    const result = await this.uploadService.processImageWithLLM(
      image, 
      customer_code, 
      measure_datetime, 
      measure_type
    );

    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }
}
