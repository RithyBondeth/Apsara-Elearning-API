import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  INotificationHttpController,
  MarkReadResponseDTO,
  NotificationListResponseDTO,
  NotificationQueryDTO,
  USER_SERVICE,
} from '@app/contracts';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, rpcCall } from '@app/common';

/**
 * The learner's notification feed.
 *
 * Every action resolves the user from the JWT, never from the request body, so
 * one learner can't read or dismiss another's notifications.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController implements INotificationHttpController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications with the unread count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Notifications newest first, plus the total unread count for the bell badge',
    type: NotificationListResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDTO,
  ): Promise<NotificationListResponseDTO> {
    return rpcCall<NotificationListResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.NOTIFICATION_FIND_BY_USER,
      { userId, limit: query.limit, unreadOnly: query.unreadOnly },
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark every notification as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked read',
    type: MarkReadResponseDTO,
  })
  markAllRead(
    @CurrentUser('id') userId: string,
  ): Promise<MarkReadResponseDTO> {
    return rpcCall<MarkReadResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.NOTIFICATION_MARK_ALL_READ,
      { userId },
    );
  }

  /* Declared after 'read-all' so that literal path isn't captured as an :id. */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked read',
    type: MarkReadResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MarkReadResponseDTO> {
    return rpcCall<MarkReadResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.NOTIFICATION_MARK_READ,
      { userId, id },
    );
  }
}
