import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule } from '@app/common';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    CategoryModule,
    CourseModule,
    UserModule,
  ],
})
export class AdminGatewayModule {}
