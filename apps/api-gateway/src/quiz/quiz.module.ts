import { Module } from '@nestjs/common';
import { JwtModule, RabbitmqModule } from '@app/common';
import { ASSESSMENT_SERVICE } from '@app/contracts';
import { QuizController } from './quiz.controller';

@Module({
  imports: [
    JwtModule,
    RabbitmqModule.register([
      { name: ASSESSMENT_SERVICE.NAME, queueKey: 'rabbitmq.assessmentQueue' },
    ]),
  ],
  controllers: [QuizController],
})
export class QuizModule {}
