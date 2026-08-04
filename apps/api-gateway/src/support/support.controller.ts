import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ContactSupportRequestDTO,
  MessageResponseDTO,
} from '@app/contracts';
import { SupportService } from './support.service';

const CONTACT_LIMIT = { default: { limit: 3, ttl: 10 * 60_000 } };

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle(CONTACT_LIMIT)
  @ApiOperation({ summary: 'Send a public contact request to Apsara Support' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'The support message was accepted for delivery',
    type: MessageResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The submitted contact details are invalid',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many contact requests from this client',
  })
  sendContactMessage(
    @Body() dto: ContactSupportRequestDTO,
  ): Promise<MessageResponseDTO> {
    return this.supportService.sendContactMessage(dto);
  }
}
