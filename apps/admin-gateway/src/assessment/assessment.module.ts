import { Module } from '@nestjs/common';
import { RabbitmqModule } from '@app/common';
import { ASSESSMENT_SERVICE } from '@app/contracts';
import { AssessmentController } from './assessment.controller';

@Module({
  imports: [
    RabbitmqModule.register([
      { name: ASSESSMENT_SERVICE.NAME, queueKey: 'rabbitmq.assessmentQueue' },
    ]),
  ],
  controllers: [AssessmentController],
})
export class AssessmentModule {}
