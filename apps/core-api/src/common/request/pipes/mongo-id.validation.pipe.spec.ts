import { MongoIdValidationPipe } from './mongoId.validation.pipe';

describe('MongoIdValidationPipe', () => {
  it('should be defined', () => {
    expect(new MongoIdValidationPipe()).toBeDefined();
  });
});
