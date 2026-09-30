import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AnnouncementAudienceDTO,
  AnnouncementPreviewResponseDTO,
  AnnouncementResponseDTO,
  CreateAnnouncementRequestDTO,
  USER_SERVICE,
} from '@app/contracts';
import { CurrentUser, rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Announcements to learners. Each one lands in every recipient's notification
 * feed; preview first to see how many learners an audience reaches.
 */
@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Announcements sent, newest first' })
  @ApiResponse({ status: HttpStatus.OK, type: [AnnouncementResponseDTO] })
  findAll(): Promise<AnnouncementResponseDTO[]> {
    return rpcCall<AnnouncementResponseDTO[]>(
      this.userClient,
      USER_SERVICE.ACTIONS.ANNOUNCEMENT_FIND_ALL,
      {},
    );
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'How many learners an audience reaches right now' })
  @ApiResponse({ status: HttpStatus.OK, type: AnnouncementPreviewResponseDTO })
  preview(
    @Body() audience: AnnouncementAudienceDTO,
  ): Promise<AnnouncementPreviewResponseDTO> {
    return rpcCall<AnnouncementPreviewResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.ANNOUNCEMENT_PREVIEW,
      audience,
    );
  }

  @Post()
  @ApiOperation({ summary: "Send an announcement to an audience's learners" })
  @ApiResponse({ status: HttpStatus.CREATED, type: AnnouncementResponseDTO })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No learners match the audience (nothing is sent)',
  })
  send(
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateAnnouncementRequestDTO,
  ): Promise<AnnouncementResponseDTO> {
    return rpcCall<AnnouncementResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.ANNOUNCEMENT_SEND,
      { actorId, dto },
    );
  }
}
