import { Module } from '@nestjs/common';
import { RabbitmqModule } from '@app/common';
import { ASSESSMENT_SERVICE } from '@app/contracts';
import { AssessmentController } from './controllers/assessment.controller';
import { ChallengeController } from './controllers/challenge.controller';
import { GradingController } from './controllers/grading.controller';

@Module({
  imports: [
    RabbitmqModule.register([
      { name: ASSESSMENT_SERVICE.NAME, queueKey: 'rabbitmq.assessmentQueue' },
    ]),
  ],
  controllers: [AssessmentController, ChallengeController, GradingController],
})
export class AssessmentModule {}
