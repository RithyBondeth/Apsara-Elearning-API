import { ApiProperty } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageRequestDTO {
  @ApiProperty({ example: 'How do I write a for loop in JavaScript?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;

  // No provider/model fields: the server's AI_PROVIDER / *_MODEL settings
  // decide, so a learner can't route their turns to a pricier model.
}

export class AiMessageResponseDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  conversationId!: string;

  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty({ example: 'How do I write a for loop in JavaScript?' })
  content!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ required: false, example: 'anthropic' })
  provider?: string;

  @ApiProperty({ required: false, example: 'claude-opus-4-8' })
  model?: string;

  constructor(partial: DtoInit<AiMessageResponseDTO> = {}) {
    Object.assign(this, partial);
  }
}

export class SendMessageResponseDTO {
  constructor(partial: DtoInit<SendMessageResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: AiMessageResponseDTO })
  message: AiMessageResponseDTO;

  @ApiProperty({ example: false, description: 'True when the reply is mocked' })
  mock: boolean;
}
