import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfirmService {
  private readonly dbPool: Pool;

  constructor() {
    this.dbPool = new Pool({
      // user: process.env.POSTGRES_USER,
      // host: process.env.POSTGRES_HOST,
      // database: process.env.POSTGRES_DB,
      // password: process.env.POSTGRES_PASSWORD,
      // port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      user: "nestuser",
      host: "db",
      database: "water_gas_management",
      password: "nestpassword",
      port: 5432
    });
  }

  async confirmMeasurement(measureUuid: string, confirmedValue: number): Promise<void> {
    if (!this.isValidUUID(measureUuid)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'UUID fornecido é inválido',
      });
    }

    const result = await this.dbPool.query(
      `SELECT confirmed FROM measurements WHERE measure_uuid = $1`,
      [measureUuid]
    );

    if (result.rowCount === 0) {
      throw new NotFoundException({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      });
    }

    const existing = result.rows[0];

    if (existing.confirmed) {
      throw new ConflictException({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura já confirmada',
      });
    }

    await this.dbPool.query(
      `UPDATE measurements SET confirmed_value = $1, confirmed = TRUE WHERE measure_uuid = $2`,
      [confirmedValue, measureUuid]
    );
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
  }
}
