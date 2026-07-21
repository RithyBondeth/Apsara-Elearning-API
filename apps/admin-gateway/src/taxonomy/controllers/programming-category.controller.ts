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
  COURSE_SERVICE,
  CreateProgrammingCategoryRequestDTO,
  UpdateProgrammingCategoryRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../../utils/rpc-call';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Programming Categories')
@ApiBearerAuth()
@Controller('programming-categories')
export class ProgrammingCategoryController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a programming category' })
  create(@Body() body: CreateProgrammingCategoryRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all programming categories' })
  findAll() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a programming category by id' })
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a programming category' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateProgrammingCategoryRequestDTO,
  ) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a programming category' })
  remove(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_DELETE,
      { id },
    );
  }
}
