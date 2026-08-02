import { ApiProperty } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';

/**
 * Shared response for delete/remove mutations that return a confirmation
 * message plus the affected resource id.
 */
export class DeleteResponseDTO {
  constructor(partial: DtoInit<DeleteResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'Resource deleted successfully' })
  message: string;

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;
}
