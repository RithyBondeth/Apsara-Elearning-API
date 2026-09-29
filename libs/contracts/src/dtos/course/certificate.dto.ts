import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
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

  @ApiPropertyOptional({
    description:
      'Why it was withdrawn — shown to its holder, never on public verification',
    example: null,
  })
  revocationReason?: string | null;
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

/** Admin search over issued certificates. */
export class AdminCertificateQueryDTO {
  @ApiPropertyOptional({
    description: 'Matches code, learner name or email, or course title',
    example: 'APS-4K7M',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class RevokeCertificateRequestDTO {
  @ApiProperty({
    example: 'Quiz answers were shared between accounts',
    description: 'Recorded for audit and shown to the certificate holder',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}

/** A certificate as the admin console sees it — includes who holds it. */
export class AdminCertificateDTO {
  constructor(partial: DtoInit<AdminCertificateDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty({ example: 'APS-4K7M-QW2X-9BTF' }) code: string;
  @ApiProperty() userId: string;
  @ApiProperty({ example: 'Sok Dara' }) learnerName: string;
  @ApiProperty({ example: 'dara@example.com' }) learnerEmail: string;
  @ApiProperty() courseId: string;
  @ApiProperty({ example: 'Grade 12 Chemistry' }) courseTitle: string;
  @ApiProperty() issuedAt: Date;
  @ApiPropertyOptional({ nullable: true }) revokedAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) revocationReason: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Admin who revoked it; null if not revoked or since deleted',
  })
  revokedBy: string | null;
}
