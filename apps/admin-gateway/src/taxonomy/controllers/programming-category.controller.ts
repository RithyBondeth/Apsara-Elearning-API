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
  DeleteResponseDTO,
  IAdminProgrammingCategoryController,
  ProgrammingCategoryResponseDTO,
  UpdateProgrammingCategoryRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Programming Categories')
@ApiBearerAuth()
@Controller('programming-categories')
export class ProgrammingCategoryController implements IAdminProgrammingCategoryController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a programming category' })
  create(
    @Body() body: CreateProgrammingCategoryRequestDTO,
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all programming categories' })
  findAll(): Promise<ProgrammingCategoryResponseDTO[]> {
    return rpcCall<ProgrammingCategoryResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_FIND_ALL,
      {},
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a programming category by id' })
  findOne(@Param('id') id: string): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
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
  ): Promise<ProgrammingCategoryResponseDTO> {
    return rpcCall<ProgrammingCategoryResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_UPDATE,
      { id, ...body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a programming category' })
  remove(@Param('id') id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.PROGRAMMING_CATEGORY_DELETE,
      { id },
    );
  }
}
