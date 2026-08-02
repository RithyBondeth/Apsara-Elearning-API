import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreatePlanRequestDTO,
  DeleteResponseDTO,
  IAdminPlanController,
  PlanResponseDTO,
  SUBSCRIPTION_SERVICE,
  UpdatePlanRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Plans (Admin)')
@ApiBearerAuth()
@Controller('plans')
export class PlanController implements IAdminPlanController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  @Post()
  create(@Body() body: CreatePlanRequestDTO): Promise<PlanResponseDTO> {
    return rpcCall<PlanResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_CREATE,
      body,
    );
  }

  @Get()
  findAll(): Promise<PlanResponseDTO[]> {
    return rpcCall<PlanResponseDTO[]>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PlanResponseDTO> {
    return rpcCall<PlanResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePlanRequestDTO,
  ): Promise<PlanResponseDTO> {
    return rpcCall<PlanResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.client,
      SUBSCRIPTION_SERVICE.ACTIONS.PLAN_DELETE,
      { id },
    );
  }
}
