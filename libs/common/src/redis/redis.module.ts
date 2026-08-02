import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';
import { RedisService } from './redis.service';

/**
 * Provides one shared ioredis connection (or null when REDIS_URL is unset) and
 * a RedisService over it. Global so any importing app gets both without
 * re-declaring; import it once per app that needs Redis.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('redis.url');
        return url ? new Redis(url, { maxRetriesPerRequest: null }) : null;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
