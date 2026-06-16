import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageRequestDTO {
  @ApiProperty({ example: 'How do I write a for loop in JavaScript?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;
}
