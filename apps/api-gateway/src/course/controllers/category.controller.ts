import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateCategoryRequestDTO,
  UpdateCategoryRequestDTO,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../../utils/rpc-call';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  createCategory(@Body() createCategoryReqDTO: CreateCategoryRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_CREATE,
      createCategoryReqDTO,
    );
  }

  @Get()
  findAllCategories() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ALL,
      {},
    );
  }

  // Must precede `:id` so the literal segment is not captured as an id.
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id')
  findOneCategory(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ONE,
      id,
    );
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryReqDTO: UpdateCategoryRequestDTO,
  ) {
    return rpcCall(this.courseClient, COURSE_SERVICE.ACTIONS.CATEGORY_UPDATE, {
      id,
      ...updateCategoryReqDTO,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  deleteCategory(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_DELETE,
      id,
    );
  }
}
