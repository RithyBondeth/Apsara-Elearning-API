import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsNotEmpty, IsString } from 'class-validator';

export class AccountDeletionRequestDTO {
  @ApiProperty({
    example: 'myPassword@123',
    description: 'Current password, to confirm it is really the account owner',
  })
  @IsString()
  @IsNotEmpty()
  @IsByteLength(0, 72)
  password: string;
}

// Internal payload sent over RMQ (gateway injects userId from the JWT).
export class AccountDeletionPayloadDTO extends AccountDeletionRequestDTO {
  userId: string;
}

export class AccountDeletionResponseDTO {
  constructor(partial: Partial<AccountDeletionResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    example: '2026-10-06T09:00:00.000Z',
    description: 'When the account will be deleted unless the owner signs in',
  })
  deleteAfter: Date;
}
