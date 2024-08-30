import { Controller, Get, Param, Query, BadRequestException, NotFoundException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ListService } from './list.service';
import { ListMeasuresDto } from './dto/list-measures.dto';

@ApiTags('list')
@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get('/:customer_code/list')
  @ApiOperation({ summary: 'Lista as medidas realizadas por um cliente' })
  @ApiParam({ name: 'customer_code', description: 'Código do cliente', type: String })
  @ApiQuery({ name: 'measure_type', required: false, enum: ['WATER', 'GAS'], description: 'Tipo de medição' })
  @ApiResponse({
    status: 200,
    description: 'Operação realizada com sucesso',
    schema: {
      example: {
        customer_code: '12345',
        measures: [
          {
            measure_uuid: '550e8400-e29b-41d4-a716-446655440000',
            measure_datetime: '2024-08-30T10:00:00Z',
            measure_type: 'WATER',
            has_confirmed: true,
            image_url: 'http://example.com/image.png',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetro measure_type diferente de WATER ou GAS',
    schema: {
      example: {
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum registro encontrado',
    schema: {
      example: {
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      },
    },
  })
  async listMeasures(
    @Param('customer_code') customerCode: string,
    @Query() query: ListMeasuresDto,
  ) {
    const { measure_type } = query;

    if (measure_type && !['WATER', 'GAS'].includes(measure_type.toUpperCase())) {
      throw new BadRequestException({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      });
    }

    const result = await this.listService.getMeasuresByCustomerCode(customerCode, measure_type);

    if (!result.measures.length) {
      throw new NotFoundException({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    }

    return result;
  }
}
