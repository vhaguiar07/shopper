import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmService } from './confirm.service';
import { Pool, QueryResult } from 'pg';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockQuery = jest.fn();
const dbPoolMock = {
  query: mockQuery,
};

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmService,
        {
          provide: Pool,
          useValue: dbPoolMock,
        },
      ],
    }).compile();

    service = module.get<ConfirmService>(ConfirmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmMeasurement', () => {
    it('should throw BadRequestException if UUID is invalid', async () => {
      await expect(service.confirmMeasurement('invalid-uuid', 1234)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if measurement is not found', async () => {
      const mockQueryResult: QueryResult<any> = { rowCount: 0, rows: [], command: 'SELECT', oid: 0, fields: [] } as any;
      dbPoolMock.query.mockResolvedValueOnce(mockQueryResult);
      await expect(service.confirmMeasurement('553a6e3e-6b3e-48fd-8310-f0af5864b43c', 1234)).rejects.toThrow(NotFoundException);
    });

  });

});
