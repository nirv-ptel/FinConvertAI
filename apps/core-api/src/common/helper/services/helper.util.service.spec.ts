import { Test, TestingModule } from '@nestjs/testing';
import { HelperUtilService } from './helper.util.service';

describe('HelperUtilService', () => {
  let service: HelperUtilService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelperUtilService],
    }).compile();

    service = module.get<HelperUtilService>(HelperUtilService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
