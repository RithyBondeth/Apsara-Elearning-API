import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { ConfigModule, LoggerModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { AuthServiceService } from './auth-service.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<any>('jwt.expires'),
        },
      }),
    }),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
