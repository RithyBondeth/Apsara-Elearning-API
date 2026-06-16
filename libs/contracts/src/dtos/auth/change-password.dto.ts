import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordRequestDTO {
  @ApiProperty({ example: 'currentPassword@123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}

// Internal payload sent over RMQ (gateway injects userId from the JWT).
export class ChangePasswordPayloadDTO extends ChangePasswordRequestDTO {
  userId: string;
}
