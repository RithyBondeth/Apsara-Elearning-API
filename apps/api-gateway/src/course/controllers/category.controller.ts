import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
  CategoryResponseDTO,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created',
    type: CategoryResponseDTO,
  })
  createCategory(@Body() createCategoryReqDTO: CreateCategoryRequestDTO) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_CREATE,
      createCategoryReqDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All categories retrieved',
    type: [CategoryResponseDTO],
  })
  findAllCategories() {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_ALL,
      {},
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved',
    type: CategoryResponseDTO,
  })
  findBySlug(@Param('slug') slug: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved',
    type: CategoryResponseDTO,
  })
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
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated',
    type: CategoryResponseDTO,
  })
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
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category deleted' })
  deleteCategory(@Param('id') id: string) {
    return rpcCall(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CATEGORY_DELETE,
      id,
    );
  }
}
