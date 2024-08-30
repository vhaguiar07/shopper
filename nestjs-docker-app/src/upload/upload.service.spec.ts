import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Pool, QueryResult } from 'pg';
import * as fs from 'fs-extra';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const generateRandomCode = (prefix: string) => `${prefix}-${uuidv4()}`;

describe('UploadService', () => {
  let service: UploadService;
  let imageAnnotatorClientMock: jest.Mocked<ImageAnnotatorClient>;
  let dbPoolMock: { query: jest.Mock };
  let fsMock: jest.Mocked<typeof fs>;

  beforeEach(async () => {
    imageAnnotatorClientMock = {
      textDetection: jest.fn(),
    } as unknown as jest.Mocked<ImageAnnotatorClient>;
  
    fsMock = {
      writeFile: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue('fake-image-data'),
      mkdirp: jest.fn().mockResolvedValue(undefined), // Mock para criar diretórios
    } as unknown as jest.Mocked<typeof fs>;
  
    jest.spyOn(fs, 'writeFile').mockImplementation(fsMock.writeFile);
    jest.spyOn(fs, 'remove').mockImplementation(fsMock.remove);
    jest.spyOn(fs, 'readFile').mockImplementation(fsMock.readFile);
    jest.spyOn(fs, 'mkdirp').mockImplementation(fsMock.mkdirp); // Mock para mkdirp
  
    dbPoolMock = {
      query: jest.fn(),
    };
  
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ImageAnnotatorClient, useValue: imageAnnotatorClientMock },
        { provide: Pool, useValue: dbPoolMock },
      ],
    }).compile();
  
    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateBase64', () => {
    it('should return true for valid base64 image', () => {
      const validBase64 = 'data:image/png;base64,abc';
      expect(service.validateBase64(validBase64)).toBe(true);
    });

    it('should return false for invalid base64 image', () => {
      const invalidBase64 = 'abc123';
      expect(service.validateBase64(invalidBase64)).toBe(false);
    });
  });

  describe('processImageWithLLM', () => {
    it('should throw BadRequestException if base64 image is invalid', async () => {
      const invalidBase64 = 'abc123';
      const customerCode = generateRandomCode('customerCode');
      await expect(service.processImageWithLLM(invalidBase64, customerCode, new Date(), 'WATER')).rejects.toThrow(BadRequestException);
    });

    const customerCodeValid = generateRandomCode('customerCode');

    it('should successfully process image and save to database', async () => {
      const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAADdElEQVRoQ+1YTyh0URQ/M4wiZWoyiYiiWWiE2dCkpkYsWNvbspDSbEezm2ykWMremlhgM1OjRo2ULBBFEoUihPm+79x689373h3vvNe8l3Tvarrv3Ht+f+4977zx/Pk34BcMjyLyw1xUjvwwQ0A5ohxxSAF1tBwS1va2yhHb0jm0UDnikLC2t7XlyOfnJzw+PrKkgUAAPB6PFMDr6yu8v79DXV0d1NTUfAvy6emJPW9oaLBFxhaRYDAId3d3LOHHxwdUV1cLyTOZDAwNDRkAPTw8gN/vF+YnJiZgfX1dmGtpaYGrqytLhGwR4R2QESnnECLjP382NzdhbGxMCnhxcRFmZmbIZCwT6e7uhuPj41ICPZHOzk44OzsrC2BhYQHm5ubY8+8I60mbMbJERHZk9ET04LLZLESjUQGH5gofi/fu/v4empqaSrFWPl7JRKanp2FlZcUgzHdENCBHR0fQ09MjAFxbW4PJyUk219zcDNfX1waXKk7k4uICOjo6pO7yRN7e3qC2ttag6NfXl1AQeID5fJ4JtLq6+nOI8EyRfHt7O5u6ublhqmujnNIoCl+mHXUEy25jY2PZyy6zrbW1VSinMoDDw8Ows7NTWo4n4Pz83OyOl56T7oh2tF5eXtjLzaz88tnxEvt8vtJUOp2GRCJhAKgvElbcYBWQ8nfQ8/Mz1NfX/2fPvcll7xEepR5gsViUll19HJJF0tRBIqLfjOpIV1cXnJ6elpaPjo7C1taWFJvsnYJuVlVVkbg4RmRjYwPGx8cFEJTjwhOKRCKAVY0yHCGCgL1er5Cfqi62JUtLS2wtVjBsOinDESLYGGrdLIK4vLyEtrY2Ch4oFArQ19dnWqoNx51y2a3cEbzM/LmOxWKwt7dnIIFz2PliW9Lf3w8HBwcsZnd3F+LxOPuNXTUWE8qouCPYimBLoo1wOCx0vDiPz1OpFCSTSYPyAwMDsL+/z+ZDoRCcnJxQeNDKrxVHzDpa3EvWNKIjCJwv89vb2zAyMuI+Ef2xKodARkQWS6ly2rqKHq3Dw0Po7e01VVADeHt7K7Tt/ML5+Xnh6JltWlEi+FU3OztrllO4M7lcDgYHB4U1U1NTsLy8bLoPH2CLiKUMLgUrIi4JTU6jHCFL5VKgcsQloclplCNkqVwKVI64JDQ5jXKELJVLgcoRl4Qmp/kL8RYvicCOhVYAAAAASUVORK5CYII=';
      const mockQueryResult: QueryResult<any> = { rowCount: 0, rows: [], command: 'SELECT', oid: 0, fields: [] } as any;
      dbPoolMock.query.mockResolvedValueOnce(mockQueryResult);
      imageAnnotatorClientMock.textDetection.mockResolvedValueOnce([{ textAnnotations: [{ description: '123' }] }] as any);
      const result = await service.processImageWithLLM(validBase64, customerCodeValid, new Date(), 'WATER');
      
      expect(result).toHaveProperty('image_url');
      expect(result).toHaveProperty('measure_value');
      expect(result).toHaveProperty('measure_uuid');
    });

    it('should throw ConflictException if reading already exists', async () => {
      const mockQueryResult: QueryResult<any> = { rowCount: 1, rows: [], command: 'SELECT', oid: 0, fields: [] } as any;
      dbPoolMock.query.mockResolvedValueOnce(mockQueryResult);
      const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAADdElEQVRoQ+1YTyh0URQ/M4wiZWoyiYiiWWiE2dCkpkYsWNvbspDSbEezm2ykWMremlhgM1OjRo2ULBBFEoUihPm+79x689373h3vvNe8l3Tvarrv3Ht+f+4977zx/Pk34BcMjyLyw1xUjvwwQ0A5ohxxSAF1tBwS1va2yhHb0jm0UDnikLC2t7XlyOfnJzw+PrKkgUAAPB6PFMDr6yu8v79DXV0d1NTUfAvy6emJPW9oaLBFxhaRYDAId3d3LOHHxwdUV1cLyTOZDAwNDRkAPTw8gN/vF+YnJiZgfX1dmGtpaYGrqytLhGwR4R2QESnnECLjP382NzdhbGxMCnhxcRFmZmbIZCwT6e7uhuPj41ICPZHOzk44OzsrC2BhYQHm5ubY8+8I60mbMbJERHZk9ET04LLZLESjUQGH5gofi/fu/v4empqaSrFWPl7JRKanp2FlZcUgzHdENCBHR0fQ09MjAFxbW4PJyUk219zcDNfX1waXKk7k4uICOjo6pO7yRN7e3qC2ttag6NfXl1AQeID5fJ4JtLq6+nOI8EyRfHt7O5u6ublhqmujnNIoCl+mHXUEy25jY2PZyy6zrbW1VSinMoDDw8Ows7NTWo4n4Pz83OyOl56T7oh2tF5eXtjLzaz88tnxEvt8vtJUOp2GRCJhAKgvElbcYBWQ8nfQ8/Mz1NfX/2fPvcll7xEepR5gsViUll19HJJF0tRBIqLfjOpIV1cXnJ6elpaPjo7C1taWFJvsnYJuVlVVkbg4RmRjYwPGx8cFEJTjwhOKRCKAVY0yHCGCgL1er5Cfqi62JUtLS2wtVjBsOinDESLYGGrdLIK4vLyEtrY2Ch4oFArQ19dnWqoNx51y2a3cEbzM/LmOxWKwt7dnIIFz2PliW9Lf3w8HBwcsZnd3F+LxOPuNXTUWE8qouCPYimBLoo1wOCx0vDiPz1OpFCSTSYPyAwMDsL+/z+ZDoRCcnJxQeNDKrxVHzDpa3EvWNKIjCJwv89vb2zAyMuI+Ef2xKodARkQWS6ly2rqKHq3Dw0Po7e01VVADeHt7K7Tt/ML5+Xnh6JltWlEi+FU3OztrllO4M7lcDgYHB4U1U1NTsLy8bLoPH2CLiKUMLgUrIi4JTU6jHCFL5VKgcsQloclplCNkqVwKVI64JDQ5jXKELJVLgcoRl4Qmp/kL8RYvicCOhVYAAAAASUVORK5CYII=';
      await expect(service.processImageWithLLM(validBase64, customerCodeValid, new Date(), 'WATER')).rejects.toThrow(ConflictException);
    });
  });

  const extractHighlightedMeasureValue = (service: UploadService, result: any) => {
    const method = (service as any).extractHighlightedMeasureValue;
    return method.call(service, result);
  };

  it('should extract the highest value from text annotations', () => {
    const result = {
      textAnnotations: [
        { description: 'Test' },
        { description: '100', boundingPoly: { vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }] } },
        { description: '200', boundingPoly: { vertices: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }] } },
      ],
    } as any;
    
    expect(extractHighlightedMeasureValue(service, result)).toBe(200);
  });
});
