import { DynamicModule, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthJwtAccessStrategy } from './guards/jwt-access/auth.jwt.access.strategy';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [AuthService,JwtService],
  exports: [AuthService],
  controllers: [],
  imports: [],
})
export class AuthModule {
  static forRoot(): DynamicModule {
      return {
          module: AuthModule,
          providers: [AuthJwtAccessStrategy],
          exports: [],
          controllers: [],
          imports: [],
      };
  }
}

