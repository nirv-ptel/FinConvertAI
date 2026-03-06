import { DynamicModule, ForwardReference, Module, Type} from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ActivityModule } from 'src/admin/activity/activity.module';
import { AdminModule } from 'src/admin/admin/admin.module';
import { CustomerModule } from 'src/admin/customer/customer.module';

@Module({})
export class RoutesAdminModule {
    static forRoot():DynamicModule{
        const imports : (DynamicModule | Type<any> | Promise<DynamicModule> | ForwardReference<any>)[] = [];
        imports.push(
            AdminModule,
            CustomerModule,
            ActivityModule,
            RouterModule.register([
                {
                    path : '/admin',
                    children:[
                        AdminModule,
                        CustomerModule,
                        ActivityModule,
                    ]
                }
            ])
        )
        return{
            module : RoutesAdminModule,
            providers:[],
            exports:[],
            controllers:[],
            imports
        }
    }
}