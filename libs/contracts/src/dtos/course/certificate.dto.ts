import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DtoInit } from '../../types/dto-init';

export class CertificateResponseDTO {
  constructor(partial: DtoInit<CertificateResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  courseId: string;

  @ApiProperty({
    description: 'Public verification code printed on the certificate',
    example: 'APS-4K7M-QW2X-9BTF',
  })
  code: string;

  @ApiProperty({ example: 'Grade 12 Mathematics' })
  courseTitle: string;

  @ApiPropertyOptional({ example: 'គណិតវិទ្យា ថ្នាក់ទី១២' })
  courseTitleKm?: string | null;

  @ApiPropertyOptional({ example: 'grade-12-mathematics' })
  courseSlug?: string;

  @ApiProperty({ example: '2026-08-04T00:00:00.000Z' })
  issuedAt: Date;

  @ApiPropertyOptional({
    description: 'Set when the certificate has been withdrawn',
    example: null,
  })
  revokedAt?: Date | null;
}

/**
 * What an unauthenticated verifier is shown.
 *
 * Deliberately narrow: the learner's display name and what they completed is
 * exactly enough to confirm a claim, and nothing else about them is anyone
 * else's business. No email, no user id, no progress detail.
 */
export class CertificateVerificationResponseDTO {
  constructor(partial: DtoInit<CertificateVerificationResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 'APS-4K7M-QW2X-9BTF' })
  code: string;

  @ApiProperty({
    description:
      'False when the code is unknown or the certificate was revoked',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({ example: 'Sokha Chan' })
  learnerName?: string;

  @ApiPropertyOptional({ example: 'Grade 12 Mathematics' })
  courseTitle?: string;

  @ApiPropertyOptional({ example: 'គណិតវិទ្យា ថ្នាក់ទី១២' })
  courseTitleKm?: string | null;

  @ApiPropertyOptional({ example: '2026-08-04T00:00:00.000Z' })
  issuedAt?: Date;

  @ApiPropertyOptional({ example: null })
  revokedAt?: Date | null;
}
