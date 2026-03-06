import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';

@Module({
  controllers: [ActivityController],
  providers: [],
})
export class ActivityModule {}
