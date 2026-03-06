import { Module } from '@nestjs/common';
import { RoutesUserModule } from './routes/routes.user.module';
import { RoutesAdminModule } from 'src/router/routes/routes.admin.module';

@Module({
    imports : [
        RoutesAdminModule.forRoot(),
        RoutesUserModule.forRoot(),
    ]
})
export class RouterModule {}
