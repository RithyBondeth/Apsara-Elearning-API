import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from './message.service';

interface IRmqQueueOption {
  name: string; // The injection token (e.g., 'AUTH_SERVICE')
  queueKey: string; // The config path (e.g., 'rabbitmq.authQueue')
}

@Global()
@Module({
  exports: [ClientsModule],
  providers: [RabbitmqService],
})
export class RabbitmqModule {
  static register(queues: IRmqQueueOption[]): DynamicModule {
    return {
      module: RabbitmqModule,
      imports: [
        ClientsModule.registerAsync(
          queues.map((q) => ({
            name: q.name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('rabbitmq.url')!],
                queue: configService.get<string>(q.queueKey)!,
                queueOptions: {
                  durable: true,
                },
              },
            }),
            inject: [ConfigService],
          })),
        ),
      ],
      exports: [ClientsModule],
    };
  }
}
