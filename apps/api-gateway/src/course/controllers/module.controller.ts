import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts';
import { ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

// Public read-only access to modules. Mutations go through the admin gateway.
@ApiTags('Modules')
@Controller('module')
export class ModuleController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  findAllByCourse(@Query('courseId') courseId: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.MODULE_FIND_ALL, {
      courseId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.MODULE_FIND_ONE,
      id,
    );
  }
}
