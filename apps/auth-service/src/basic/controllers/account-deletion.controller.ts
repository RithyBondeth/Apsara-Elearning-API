import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AccountDeletionPayloadDTO,
  AccountDeletionResponseDTO,
  AUTH_SERVICE,
  I_ACCOUNT_DELETION_SERVICE,
} from '@app/contracts';
import type {
  IAccountDeletionRpcController,
  IAccountDeletionService,
} from '@app/contracts';

@Controller()
export class AccountDeletionController implements IAccountDeletionRpcController {
  constructor(
    @Inject(I_ACCOUNT_DELETION_SERVICE)
    private readonly accountDeletion: IAccountDeletionService,
  ) {}

  @MessagePattern(AUTH_SERVICE.ACTIONS.ACCOUNT_DELETION_REQUEST)
  request(
    @Payload() dto: AccountDeletionPayloadDTO,
  ): Promise<AccountDeletionResponseDTO> {
    return this.accountDeletion.request(dto);
  }
}
