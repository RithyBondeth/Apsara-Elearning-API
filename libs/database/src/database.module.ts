import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { DRIZZLE } from '@app/contracts';

@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: databaseConfig,
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
