import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordRequestDTO {
  @ApiProperty({ example: 'currentPassword@123' })
  @IsString()
  @IsNotEmpty()
  @IsByteLength(0, 72)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @IsByteLength(0, 72, { message: 'Password must be at most 72 bytes long' })
  newPassword: string;
}

// Internal payload sent over RMQ (gateway injects userId from the JWT).
export class ChangePasswordPayloadDTO extends ChangePasswordRequestDTO {
  userId: string;
}
