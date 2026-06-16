import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { CourseModule } from './course/course.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    AuthModule,
    UserModule,
    CourseModule,
  ],
})
export class ApiGatewayModule {}
