import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COURSE_SERVICE,
  CreateTestimonialRequestDTO,
  DeleteResponseDTO,
  TestimonialResponseDTO,
  UpdateTestimonialRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Quotes from real teachers, beta testers and partners. Each requires a
 * consent record (how and when the person agreed) before it can be saved.
 */
@ApiTags('Testimonials')
@ApiBearerAuth()
@Controller('testimonials')
export class TestimonialController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a testimonial (consent record required)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TestimonialResponseDTO })
  create(
    @Body() body: CreateTestimonialRequestDTO,
  ): Promise<TestimonialResponseDTO> {
    return rpcCall<TestimonialResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.TESTIMONIAL_CREATE,
      body,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all testimonials, newest first' })
  @ApiResponse({ status: HttpStatus.OK, type: [TestimonialResponseDTO] })
  findAll(): Promise<TestimonialResponseDTO[]> {
    return rpcCall<TestimonialResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.TESTIMONIAL_FIND_ALL,
      {},
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a testimonial' })
  @ApiResponse({ status: HttpStatus.OK, type: TestimonialResponseDTO })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTestimonialRequestDTO,
  ): Promise<TestimonialResponseDTO> {
    return rpcCall<TestimonialResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.TESTIMONIAL_UPDATE,
      { id, dto: body },
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimonial' })
  @ApiResponse({ status: HttpStatus.OK, type: DeleteResponseDTO })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<DeleteResponseDTO> {
    return rpcCall<DeleteResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.TESTIMONIAL_DELETE,
      { id },
    );
  }
}
