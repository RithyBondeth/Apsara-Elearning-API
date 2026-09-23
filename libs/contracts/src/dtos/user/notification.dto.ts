import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { DtoInit } from '../../types/dto-init';

/**
 * The kinds of notification the platform raises. Stored as text (see
 * schemas/user/notification.schema.ts), so adding one here does not need a
 * migration — but keep this list and the client's copy in sync.
 */
export const NOTIFICATION_TYPES = [
  'badge_awarded',
  'quiz_passed',
  'challenge_solved',
  'course_completed',
  'certificate_issued',
  'subscription_updated',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATIONS_DEFAULT_LIMIT = 20;
export const NOTIFICATIONS_MAX_LIMIT = 50;

export class NotificationQueryDTO {
  @ApiPropertyOptional({
    description: `How many notifications to return (max ${NOTIFICATIONS_MAX_LIMIT})`,
    default: NOTIFICATIONS_DEFAULT_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(NOTIFICATIONS_MAX_LIMIT)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Return only notifications that have not been read',
    default: false,
  })
  // Query strings carry "true"/"false", never booleans.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;
}

/** Raised by a service when something worth telling the learner happens. */
export class CreateNotificationDTO {
  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'badge_awarded' })
  @IsIn(NOTIFICATION_TYPES)
  type: NotificationType;

  @ApiProperty({ example: 'Badge earned: First Steps' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'You crossed 100 XP. Keep going!' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'Deep-link payload — ids the client needs to route',
    example: { badgeId: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}

export class NotificationResponseDTO {
  constructor(partial: DtoInit<NotificationResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: '6f1e7e2a-0c2a-4c1e-9f0a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'badge_awarded' })
  type: string;

  @ApiProperty({ example: 'Badge earned: First Steps' })
  title: string;

  @ApiPropertyOptional({ example: 'You crossed 100 XP. Keep going!' })
  body?: string | null;

  @ApiPropertyOptional({ example: { badgeId: '6f1e7e2a…' } })
  data?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    example: '2026-09-23T10:00:00.000Z',
    description: 'When the learner read it; null while unread',
  })
  readAt?: Date | null;

  @ApiProperty({ example: '2026-09-23T09:00:00.000Z' })
  createdAt: Date;
}

export class NotificationListResponseDTO {
  constructor(partial: DtoInit<NotificationListResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ type: [NotificationResponseDTO] })
  items: NotificationResponseDTO[];

  @ApiProperty({
    example: 3,
    description:
      'Unread count across all notifications, not just the returned page — it drives the bell badge',
  })
  unreadCount: number;
}

export class MarkReadResponseDTO {
  constructor(partial: DtoInit<MarkReadResponseDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty({ example: 3, description: 'How many rows were marked read' })
  updated: number;

  @ApiProperty({ example: 0, description: 'Unread count after the change' })
  unreadCount: number;
}
