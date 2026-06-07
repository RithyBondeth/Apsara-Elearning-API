import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, LoggerModule } from '@app/common';

@Module({
  imports: [ConfigModule, LoggerModule, AuthModule, UserModule],
  controllers: [AuthController, UserController],
})
export class ApiGatewayModule {}
