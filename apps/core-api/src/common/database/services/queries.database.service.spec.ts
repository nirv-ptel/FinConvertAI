import { Test, TestingModule } from '@nestjs/testing';
import { QueriesDatabaseService } from './queries.database.service';

describe('QueriesDatabaseService', () => {
  let service: QueriesDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueriesDatabaseService],
    }).compile();

    service = module.get<QueriesDatabaseService>(QueriesDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
