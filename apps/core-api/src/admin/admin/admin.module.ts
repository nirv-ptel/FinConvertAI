import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from 'src/common/auth/auth.module';

@Module({
  controllers: [AdminController],
  providers: [],
  imports:[AuthModule]
})
export class AdminModule {}
