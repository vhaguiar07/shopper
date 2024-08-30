import { Controller, Patch, Body, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConfirmService } from './confirm.service';
import { ConfirmMeasureDto } from './dto/confirm-measure.dto';

@ApiTags('confirm')
@Controller('confirm')
export class ConfirmController {
  constructor(private readonly confirmService: ConfirmService) {}

  @Patch()
  @ApiOperation({ summary: 'Confirma ou corrige o valor de uma medição' })
  @ApiBody({
    description: 'O UUID da medição e o valor a ser confirmado (ou atualizado)',
    type: ConfirmMeasureDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Operation successful',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dado inválido fornecido',
    schema: {
      example: {
        error_code: 'INVALID_DATA',
        error_description: 'Os dados fornecidos são inválidos',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Medição não encontrada',
    schema: {
      example: {
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Medição já confirmada',
    schema: {
      example: {
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura já confirmada',
      },
    },
  })
  async confirmMeasurement(@Body() body: ConfirmMeasureDto) {
    const { measure_uuid, confirmed_value } = body;

    if (isNaN(confirmed_value)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'O valor confirmado deve ser um número',
      });
    }

    try {
      await this.confirmService.confirmMeasurement(measure_uuid, confirmed_value);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Os dados fornecidos são inválidos',
      });
    }
  }
}
