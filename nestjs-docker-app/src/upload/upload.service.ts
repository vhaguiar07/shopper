import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class UploadService {
  private readonly client: ImageAnnotatorClient;
  private readonly TEMP_DIR = '/tmp';
  private readonly dbPool: Pool;

  constructor() {
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
    });
    
    this.dbPool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    });
  }

  validateBase64(base64String: string): boolean {
    const base64Regex = /^data:image\/(jpeg|png);base64,/;
    return base64Regex.test(base64String);
  }

  async processImageWithLLM(image: string, customerCode: string, measureDatetime: Date, measureType: 'WATER' | 'GAS'): Promise<any> {
    if (!this.validateBase64(image)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description: 'Base64 image data is invalid.',
      });
    }
  
    const measureMonth = measureDatetime.getMonth() + 1;
    const measureYear = measureDatetime.getFullYear();

    await this.upsertCustomer(customerCode);

    const existingReadingResult = await this.dbPool.query(
      `SELECT 1 FROM measurements 
       WHERE customer_code = $1 
       AND measure_type = $2 
       AND EXTRACT(YEAR FROM measure_datetime) = $3 
       AND EXTRACT(MONTH FROM measure_datetime) = $4`,
      [customerCode, measureType, measureYear, measureMonth]
    );

    const existingReadingCount = existingReadingResult.rowCount ?? 0;
  
    if (existingReadingCount > 0) {
      throw new ConflictException({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada.',
      });
    }
  
    try {
      const base64Data = image.replace(/^data:image\/(jpeg|png);base64,/, '');

      const tempFilePath = path.join(this.TEMP_DIR, `${uuidv4()}.png`);
      fs.writeFileSync(tempFilePath, base64Data, 'base64');

      const [result] = await this.client.textDetection(tempFilePath);

      const measureValue = this.extractHighlightedMeasureValue(result);

      const measureUuid = uuidv4();

      await this.dbPool.query(
        `INSERT INTO measurements (id, customer_code, measure_datetime, measure_type, measure_value, measure_uuid, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), customerCode, measureDatetime, measureType, measureValue, measureUuid, tempFilePath]
      );

      await fs.remove(tempFilePath);
  
      return {
        image_url: tempFilePath,
        measure_value: measureValue,
        measure_uuid: measureUuid,
      };
    } catch (error) {
      console.error('Detailed error:', error);
      throw new Error('Error processing image with Google Cloud Vision');
    }
  }

  private async upsertCustomer(customerCode: string): Promise<void> {
    try {
      const result = await this.dbPool.query(
        `SELECT id FROM customers WHERE code = $1`,
        [customerCode]
      );

      if (result.rowCount === 0) {
        await this.dbPool.query(
          `INSERT INTO customers (code) VALUES ($1)`,
          [customerCode]
        );
      }
    } catch (error) {
      console.error('Error upserting customer:', error);
      throw new Error('Error upserting customer');
    }
  }

  private extractHighlightedMeasureValue(result: any): number {
    let highlightedNumber = 0;
    let maxArea = 0;

    if (result.textAnnotations && result.textAnnotations.length > 1) {
      for (const annotation of result.textAnnotations.slice(1)) {
        const description = annotation.description;
        const vertices = annotation.boundingPoly?.vertices;

        if (vertices && vertices.length >= 4) {
          const width = Math.abs(vertices[1].x - vertices[0].x);
          const height = Math.abs(vertices[2].y - vertices[0].y);
          const area = width * height;

          const match = description.match(/\d+/);
          if (match) {
            const number = parseInt(match[0], 10);
            if (area > maxArea) {
              maxArea = area;
              highlightedNumber = number;
            }
          }
        }
      }
    }

    return highlightedNumber;
  }
}
