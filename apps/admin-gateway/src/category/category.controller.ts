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
  CreateCategoryRequestDTO,
  UpdateCategoryRequestDTO,
} from '@app/contracts';
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  create(@Body() body: CreateCategoryRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_CREATE,
      body,
    );
  }

  @Get()
  findAll() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ONE,
      { id },
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCategoryRequestDTO) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.CATEGORY_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.CATEGORY_DELETE, {
      id,
    });
  }
}
