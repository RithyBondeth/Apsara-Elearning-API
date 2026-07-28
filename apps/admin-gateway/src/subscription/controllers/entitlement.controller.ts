import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateEntitlementGrantRequestDTO,
  EntitlementGrantResponseDTO,
  ResolvedEntitlementDTO,
  SUBSCRIPTION_SERVICE,
} from '@app/contracts';
import { CurrentUser, rpcCall } from '@app/common';

@ApiTags('Entitlements (Admin)')
@ApiBearerAuth()
@Controller('entitlements')
export class EntitlementController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Get('users/:userId')
  resolve(@Param('userId') userId: string): Promise<ResolvedEntitlementDTO[]> {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_RESOLVE,
      { userId },
    );
  }

  @Get('users/:userId/grants')
  grants(
    @Param('userId') userId: string,
  ): Promise<EntitlementGrantResponseDTO[]> {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANTS_FIND,
      { userId },
    );
  }

  @Post('users/:userId/grants')
  grant(
    @Param('userId') userId: string,
    @CurrentUser('id') grantedBy: string,
    @Body() grant: CreateEntitlementGrantRequestDTO,
  ): Promise<EntitlementGrantResponseDTO> {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANT_CREATE,
      { userId, grantedBy, grant },
    );
  }

  @Delete('grants/:id')
  revoke(@Param('id') id: string): Promise<EntitlementGrantResponseDTO> {
    return rpcCall(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.ENTITLEMENT_GRANT_REVOKE,
      { id },
    );
  }
}
