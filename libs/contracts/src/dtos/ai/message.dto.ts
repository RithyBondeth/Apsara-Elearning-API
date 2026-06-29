import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageRequestDTO {
  @ApiProperty({ example: 'How do I write a for loop in JavaScript?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;
}

export class AiMessageResponseDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  conversationId: string;

  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ example: 'How do I write a for loop in JavaScript?' })
  content: string;

  @ApiProperty()
  createdAt: Date;
}
