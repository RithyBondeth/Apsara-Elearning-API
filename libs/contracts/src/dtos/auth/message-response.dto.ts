import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MessageResponseDTO {
  @ApiProperty({ example: 'Operation completed successfully' })
  @IsString()
  @IsNotEmpty()
  message: string;

  constructor(partial: Partial<MessageResponseDTO>) {
    Object.assign(this, partial);
  }
}
