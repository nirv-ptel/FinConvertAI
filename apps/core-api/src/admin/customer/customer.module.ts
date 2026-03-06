import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { AuthModule } from 'src/common/auth/auth.module';

@Module({
  controllers: [CustomerController],
  imports:[AuthModule],
  providers: [],
})
export class CustomerModule {}
