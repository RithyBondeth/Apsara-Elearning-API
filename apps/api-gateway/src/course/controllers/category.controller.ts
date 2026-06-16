import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COURSE_SERVICE } from '@app/contracts/constants/services/course-service.constant';
import { rpcCall } from 'apps/admin-gateway/src/utils/rpc-call';

@Controller('category')
export class CategoryController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  createCategory(@Body() createCategoryReqDTO: any) {
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

  @Get(':id')
  findOneCategory(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ONE,
      id,
    );
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_BY_SLUG,
      slug,
    );
  }

  @Put(':id')
  updateCategory(@Param('id') id: string, @Body() updateCategoryReqDTO: any) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_UPDATE,
      updateCategoryReqDTO,
    );
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_DELETE,
      id,
    );
  }
}
