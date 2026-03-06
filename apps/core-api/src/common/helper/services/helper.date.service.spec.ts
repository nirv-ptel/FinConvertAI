import { Test, TestingModule } from '@nestjs/testing';
import { HelperDateService } from './helper.date.service';

describe('HelperDateService', () => {
  let service: HelperDateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelperDateService],
    }).compile();

    service = module.get<HelperDateService>(HelperDateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
