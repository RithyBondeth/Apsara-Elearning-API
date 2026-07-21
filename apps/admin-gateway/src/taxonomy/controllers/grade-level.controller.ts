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
  CreateGradeLevelRequestDTO,
  UpdateGradeLevelRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Grade levels')
@ApiBearerAuth()
@Controller('grade-levels')
export class GradeLevelController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a grade level (Grade 1–12)' })
  create(@Body() body: CreateGradeLevelRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all grade levels' })
  findAll() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a grade level by id' })
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a grade level' })
  update(@Param('id') id: string, @Body() body: UpdateGradeLevelRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_UPDATE,
      {
        id,
        ...body,
      },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a grade level' })
  remove(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.GRADE_LEVEL_DELETE,
      {
        id,
      },
    );
  }
}
