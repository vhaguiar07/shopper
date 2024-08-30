import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ListService {
  private readonly dbPool: Pool;

  constructor() {
    this.dbPool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    });
  }

  async getMeasuresByCustomerCode(customerCode: string, measureType?: string): Promise<any> {
    if (measureType && !['WATER', 'GAS'].includes(measureType.toUpperCase())) {
      throw new BadRequestException({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      });
    }

    const query = `
      SELECT measure_uuid, measure_datetime, measure_type, confirmed AS has_confirmed, image_url
      FROM measurements
      WHERE customer_code = $1
      ${measureType ? 'AND measure_type = $2' : ''}
      ORDER BY measure_datetime;
    `;

    const values = measureType ? [customerCode, measureType.toUpperCase()] : [customerCode];

    try {

      const result = await this.dbPool.query(query, values);

      if (result.rowCount === 0) {
        throw new NotFoundException({
          error_code: 'MEASURES_NOT_FOUND',
          error_description: 'Nenhuma leitura encontrada',
        });
      }

      return {
        customer_code: customerCode,
        measures: result.rows,
      };
    } catch (error) {
      console.error('Database Error:', error);
      throw error;
    }
  }
}
