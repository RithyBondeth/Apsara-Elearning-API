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
  ConversationResponseDTO,
  AiMessageResponseDTO,
  AiUsageResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new AI conversation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conversation created successfully',
    type: ConversationResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'List all user conversations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    type: [ConversationResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  listConversations(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_FIND_ALL, {
      userId,
    });
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  getConversation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.CONVERSATION_FIND_ONE, {
      userId,
      id,
    });
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific conversation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Send a message to a conversation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message sent and response received',
    type: AiMessageResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'List all messages in a conversation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: [AiMessageResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get user AI usage statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage stats retrieved successfully',
    type: AiUsageResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  usage(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.USAGE_FIND_BY_USER, {
      userId,
    });
  }

  @Get('credits')
  @ApiOperation({ summary: 'Check remaining AI credits' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credits retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  credits(@CurrentUser('id') userId: string) {
    return rpcCall(this.aiClient, AI_SERVICE.ACTIONS.USAGE_CHECK_CREDITS, {
      userId,
    });
  }
}
