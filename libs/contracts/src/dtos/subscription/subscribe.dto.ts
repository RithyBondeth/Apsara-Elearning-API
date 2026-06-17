import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SubscribeRequestDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  planId: string;
}
