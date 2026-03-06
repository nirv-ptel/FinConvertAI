import { Module } from '@nestjs/common';
import { AuthModule } from 'src/common/auth/auth.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { CustomerController } from './controller/customer.controller';
import { AuthController } from './controller/auth.controller';

@Module({
  controllers: [AuthController,CustomerController],
  imports:[AuthModule,HelperModule],
  providers: [],
})
export class CustomerModule {}
