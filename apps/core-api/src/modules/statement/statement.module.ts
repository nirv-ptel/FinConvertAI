import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StatementController } from './controller/statement.controller';
import { StatementService } from './services/statement.service';

@Module({
    imports: [HttpModule],
    controllers: [StatementController],
    providers: [StatementService],
    exports: [StatementService],
})
export class StatementModule { }
