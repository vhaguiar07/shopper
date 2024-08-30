import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { Pool, QueryResult } from 'pg';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockQuery = jest.fn();
const dbPoolMock = {
  query: mockQuery,
};

describe('ListService', () => {
  let service: ListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: Pool,
          useValue: dbPoolMock,
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMeasuresByCustomerCode', () => {
    it('should throw BadRequestException if measureType is invalid', async () => {
      await expect(service.getMeasuresByCustomerCode('customer1', 'INVALID_TYPE'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no measures are found', async () => {
      const mockQueryResult: QueryResult<any> = { rowCount: 0, rows: [], command: 'SELECT', oid: 0, fields: [] } as any;
      dbPoolMock.query.mockResolvedValueOnce(mockQueryResult);
      
      await expect(service.getMeasuresByCustomerCode('customer1'))
        .rejects
        .toThrow(NotFoundException);
    });

  });

});
