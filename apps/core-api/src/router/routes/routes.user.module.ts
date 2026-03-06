import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CustomerModule } from '../../modules/customer/customer.module';
import { StatementModule } from '../../modules/statement/statement.module';

@Module({})
export class RoutesUserModule {
    static forRoot(): DynamicModule {
        const imports: (DynamicModule | Type<any> | Promise<DynamicModule> | ForwardReference<any>)[] = [];
        imports.push(
            CustomerModule,
            StatementModule,
            RouterModule.register([
                {
                    path: '/',
                    children: [
                        CustomerModule,
                        StatementModule,
                    ]
                }
            ])
        )
        return {
            module: RoutesUserModule,
            providers: [],
            exports: [],
            controllers: [],
            imports
        }
    }
}
