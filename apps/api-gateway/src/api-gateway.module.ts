import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, LoggerModule } from '@app/common';

@Module({
  imports: [ConfigModule, LoggerModule, AuthModule, UserModule],
})
export class ApiGatewayModule {}
