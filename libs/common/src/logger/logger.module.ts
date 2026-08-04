import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { TimingInterceptor } from '../interceptors/timing.interceptor';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('nodeEnv') === 'production';
        return {
          pinoHttp: {
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    mkdir: true,
                  },
                },
            level: isProduction ? 'info' : 'debug',
            // pino-http's default req serializer logs every header, which
            // would put the session bearer token and the BFF's shared proxy
            // secret into plaintext logs on every request.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-apsara-proxy-secret"]',
                'res.headers["set-cookie"]',
              ],
              remove: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  // Every app already imports LoggerModule, so registering the timing
  // interceptor here makes request/handler duration logging global for free.
  providers: [{ provide: APP_INTERCEPTOR, useClass: TimingInterceptor }],
})
export class LoggerModule {}
