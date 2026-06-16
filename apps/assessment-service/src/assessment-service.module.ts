import { Module } from '@nestjs/common';
import { ConfigurationModule, LoggerModule, RabbitmqModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { USER_SERVICE } from '@app/contracts';
import { AuthoringRpcController } from './controllers/authoring-rpc.controller';
import { AttemptRpcController } from './controllers/attempt-rpc.controller';
import { AuthoringRpcService } from './services/authoring-rpc.service';
import { AttemptRpcService } from './services/attempt-rpc.service';

@Module({
  imports: [
    ConfigurationModule,
    LoggerModule,
    DatabaseModule,
    // Client used to award XP on quiz pass.
    RabbitmqModule.register([
      { name: USER_SERVICE.NAME, queueKey: 'rabbitmq.userQueue' },
    ]),
  ],
  controllers: [AuthoringRpcController, AttemptRpcController],
  providers: [AuthoringRpcService, AttemptRpcService],
})
export class AssessmentServiceModule {}
