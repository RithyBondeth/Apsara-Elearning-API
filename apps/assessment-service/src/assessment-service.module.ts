import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, RabbitmqModule, HealthModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { I_ATTEMPT_SERVICE, I_AUTHORING_SERVICE, I_CHALLENGE_SERVICE, I_SUBMISSION_SERVICE } from '@app/contracts';
import { AssessmentHealthController } from './health/health.controller';
import { USER_SERVICE } from '@app/contracts';
import { AuthoringRpcController } from './controllers/authoring.controller';
import { AttemptRpcController } from './controllers/attempt.controller';
import { ChallengeRpcController } from './controllers/challenge.controller';
import { AuthoringRpcService } from './services/authoring.service';
import { AttemptRpcService } from './services/attempt.service';
import { ChallengeRpcService } from './services/challenge.service';
import { SubmissionRpcService } from './services/submission.service';
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
    AuthoringRpcController,
    AttemptRpcController,
    ChallengeRpcController,
    AssessmentHealthController,
  ],
  providers: [
    AuthoringRpcService,
    { provide: I_AUTHORING_SERVICE, useExisting: AuthoringRpcService },
    AttemptRpcService,
    { provide: I_ATTEMPT_SERVICE, useExisting: AttemptRpcService },
    ChallengeRpcService,
    { provide: I_CHALLENGE_SERVICE, useExisting: ChallengeRpcService },
    SubmissionRpcService,
    { provide: I_SUBMISSION_SERVICE, useExisting: SubmissionRpcService },
    CodeExecutionService,
  ],
})
export class AssessmentServiceModule {}
