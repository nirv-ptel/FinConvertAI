import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RouterModule } from '../router/router.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    CommonModule,
    RouterModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
