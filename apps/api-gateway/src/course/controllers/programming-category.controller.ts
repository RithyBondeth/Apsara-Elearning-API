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
  CreateProgrammingCategoryRequestDTO,
  UpdateProgrammingCategoryRequestDTO,
  ProgrammingCategoryResponseDTO,
  CourseResponseDTO,
  DeleteResponseDTO,
  IProgrammingCategoryHttpController,
} from '@app/contracts';
import { AdminGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Programming Categories')
@Controller('programming-category')
export class ProgrammingCategoryController implements IProgrammingCategoryHttpController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new programming category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Programming category created',
    type: ProgrammingCategoryResponseDTO,
  })
  createCategory(
    @Body() createCategoryReqDTO: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_CREATE,
      createCategoryReqDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all programming categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All programming categories retrieved',
    type: [ProgrammingCategoryResponseDTO],
  })
  findAllCategories(): Promise<ProgrammingCategoryResponseDTO[]> {
    return rpcCall<ProgrammingCategoryResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ALL,
      {},
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a programming category by slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programming category retrieved',
    type: ProgrammingCategoryResponseDTO,
  })
  findBySlug(
    @Param('slug') slug: string,
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_BY_SLUG,
      slug,
    );
  }

  @Get(':id/courses')
  @ApiOperation({ summary: 'Get all courses in a programming category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Courses retrieved',
    type: [CourseResponseDTO],
  })
  findCoursesByCategory(@Param('id') id: string): Promise<CourseResponseDTO[]> {
    return rpcCall<CourseResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.COURSE_FIND_BY_CATEGORY,
      id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a programming category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programming category retrieved',
    type: ProgrammingCategoryResponseDTO,
  })
  findOneCategory(
    @Param('id') id: string,
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ONE,
      id,
    );
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a programming category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programming category updated',
    type: ProgrammingCategoryResponseDTO,
  })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryReqDTO: UpdateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_UPDATE,
      { id, ...updateCategoryReqDTO },
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a programming category (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Programming category deleted',
    type: DeleteResponseDTO,
  })
  deleteCategory(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_DELETE,
      id,
    );
  }
}
