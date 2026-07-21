import { Module } from '@nestjs/common';
import { JwtModule, RabbitmqModule } from '@app/common';
import { AI_SERVICE } from '@app/contracts';
import { AiController } from './controllers/ai.controller';

@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      { name: AI_SERVICE.NAME, queueKey: 'rabbitmq.aiQueue' },
    ]),
  ],
  controllers: [AiController],
})
export class AiModule {}
