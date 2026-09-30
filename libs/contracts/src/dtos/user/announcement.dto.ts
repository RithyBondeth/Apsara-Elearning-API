import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { DtoInit } from '../../types/dto-init';

export const ANNOUNCEMENT_AUDIENCES = ['all', 'course'] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export const ANNOUNCEMENT_TITLE_MAX = 120;
export const ANNOUNCEMENT_BODY_MAX = 1000;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Who an announcement reaches. Admins, suspended accounts, accounts pending
 * deletion and unverified emails are never included.
 */
export class AnnouncementAudienceDTO {
  @ApiProperty({ enum: ANNOUNCEMENT_AUDIENCES, example: 'course' })
  @IsIn(ANNOUNCEMENT_AUDIENCES)
  audience: AnnouncementAudience;

  @ApiPropertyOptional({
    description: "Required when audience is 'course': its enrolled learners",
  })
  @ValidateIf((o: AnnouncementAudienceDTO) => o.audience === 'course')
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Only learners with an active (or trialing) subscription',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  subscribersOnly?: boolean;
}

export class CreateAnnouncementRequestDTO extends AnnouncementAudienceDTO {
  @ApiProperty({ example: 'New course: Grade 12 Physics' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(ANNOUNCEMENT_TITLE_MAX)
  title: string;

  @ApiProperty({
    example: 'Lessons 1–5 are live now. Start from your dashboard.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(ANNOUNCEMENT_BODY_MAX)
  body: string;
}

export class AnnouncementPreviewResponseDTO {
  constructor(partial: DtoInit<AnnouncementPreviewResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 1240, description: 'Learners it would reach now' })
  recipients: number;
}

export class AnnouncementResponseDTO {
  constructor(partial: DtoInit<AnnouncementResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() body: string;
  @ApiProperty({ enum: ANNOUNCEMENT_AUDIENCES }) audience: string;
  @ApiPropertyOptional({ nullable: true }) courseId: string | null;
  @ApiPropertyOptional({ nullable: true }) courseTitle: string | null;
  @ApiProperty() subscribersOnly: boolean;
  @ApiProperty({ example: 1240 }) recipientCount: number;
  @ApiPropertyOptional({
    nullable: true,
    description: "Sender's name; null if that admin was since deleted",
  })
  sentByName: string | null;
  @ApiProperty() createdAt: Date;
}
