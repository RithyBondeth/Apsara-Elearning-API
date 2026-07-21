import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, RabbitmqModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { USER_SERVICE } from '@app/contracts';
import { AuthoringRpcController } from './controllers/authoring-rpc.controller';
import { AttemptRpcController } from './controllers/attempt-rpc.controller';
import { ChallengeRpcController } from './controllers/challenge-rpc.controller';
import { AuthoringRpcService } from './services/authoring-rpc.service';
import { AttemptRpcService } from './services/attempt-rpc.service';
import { ChallengeRpcService } from './services/challenge-rpc.service';
import { SubmissionRpcService } from './services/submission-rpc.service';
import { CodeExecutionService } from './execution/code-execution.service';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    // Client used to award XP on quiz pass / challenge solve.
    RabbitmqModule.register([
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
    ]),
  ],
  controllers: [
    AuthoringRpcController,
    AttemptRpcController,
    ChallengeRpcController,
  ],
  providers: [
    AuthoringRpcService,
    AttemptRpcService,
    ChallengeRpcService,
    SubmissionRpcService,
    CodeExecutionService,
  ],
})
export class AssessmentServiceModule {}
