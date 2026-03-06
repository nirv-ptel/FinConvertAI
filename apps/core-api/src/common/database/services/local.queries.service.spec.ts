import { Test, TestingModule } from '@nestjs/testing';
import { LocalQueriesService } from './local.queries.service';

describe('LocalQueriesService', () => {
  let service: LocalQueriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalQueriesService],
    }).compile();

    service = module.get<LocalQueriesService>(LocalQueriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
