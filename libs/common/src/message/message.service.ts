import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export class RabbitmqService {
  static getRmqOptions(
    configService: ConfigService,
    envQueueKey: string,
  ): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('rabbitmq.url')!],
        queue: configService.get<string>(envQueueKey)!,
        queueOptions: {
          durable: true,
        },
      },
    };
  }
}
