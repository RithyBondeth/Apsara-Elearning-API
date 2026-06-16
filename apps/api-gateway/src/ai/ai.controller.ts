import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AI_SERVICE,
  CreateConversationRequestDTO,
  SendMessageRequestDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { rpcCall } from '../utils/rpc-call';

@ApiTags('Apsara AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    @Inject(AI_SERVICE.NAME) private readonly aiClient: ClientProxy,
  ) {}

  @Post('conversations')
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationRequestDTO,
  ) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_CREATE, {
      userId,
      ...dto,
    });
  }

  @Get('conversations')
  listConversations(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_FIND_ALL, {
      userId,
    });
  }

  @Get('conversations/:id')
  getConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_FIND_ONE, {
      userId,
      id,
    });
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_DELETE, {
      userId,
      id,
    });
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageRequestDTO,
  ) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.MESSAGE_SEND, {
      userId,
      conversationId,
      content: dto.content,
    });
  }

  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.MESSAGE_FIND_ALL, {
      userId,
      conversationId,
    });
  }

  @Get('usage')
  usage(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER, {
      userId,
    });
  }

  @Get('credits')
  credits(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS, {
      userId,
    });
  }
}
