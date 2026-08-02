import { Module } from '@nestjs/common';
import {
  ConfigurationModule,
  LoggerModule,
  RabbitmqModule,
  HealthModule,
  CourseEntitlementService,
  EntitlementService,
} from '@app/common';
import { DatabaseModule } from '@app/database';
import {
  I_ATTEMPT_SERVICE,
  I_AUTHORING_SERVICE,
  I_CHALLENGE_SERVICE,
  I_SUBMISSION_SERVICE,
} from '@app/contracts';
import { AssessmentHealthController } from './health/health.controller';
import { USER_SERVICE } from '@app/contracts';
import { AuthoringController } from './controllers/authoring.controller';
import { AttemptController } from './controllers/attempt.controller';
import { ChallengeController } from './controllers/challenge.controller';
import { AuthoringService } from './services/authoring.service';
import { AttemptService } from './services/attempt.service';
import { ChallengeService } from './services/challenge.service';
import { SubmissionService } from './services/submission.service';
import { CodeExecutionService } from './execution/code-execution.service';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    HealthModule,
    // Client used to award XP on quiz pass / challenge solve.
    RabbitmqModule.register([
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
    ]),
  ],
  controllers: [
    AuthoringController,
    AttemptController,
    ChallengeController,
    AssessmentHealthController,
  ],
  providers: [
    EntitlementService,
    CourseEntitlementService,
    AuthoringService,
    { provide: I_AUTHORING_SERVICE, useExisting: AuthoringService },
    AttemptService,
    { provide: I_ATTEMPT_SERVICE, useExisting: AttemptService },
    ChallengeService,
    { provide: I_CHALLENGE_SERVICE, useExisting: ChallengeService },
    SubmissionService,
    { provide: I_SUBMISSION_SERVICE, useExisting: SubmissionService },
    CodeExecutionService,
  ],
})
export class AssessmentServiceModule {}
