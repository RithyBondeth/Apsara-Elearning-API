import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CONTACT_SUPPORT_CATEGORIES = [
  'account',
  'learning',
  'aiTutor',
  'billing',
  'privacy',
  'other',
] as const;

export type ContactSupportCategory =
  (typeof CONTACT_SUPPORT_CATEGORIES)[number];

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ContactSupportRequestDTO {
  @ApiProperty({ example: 'Sokha Chan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(trim)
  name: string;

  @ApiProperty({ example: 'sokha@example.com' })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ enum: CONTACT_SUPPORT_CATEGORIES, example: 'learning' })
  @IsIn(CONTACT_SUPPORT_CATEGORIES)
  category: ContactSupportCategory;

  @ApiProperty({ example: 'My lesson progress is not updating' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Transform(trim)
  subject: string;

  @ApiProperty({
    example:
      'I completed Lesson 4, but my course progress still shows the previous value.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @Transform(trim)
  message: string;

  @ApiProperty({
    description: 'Client-generated identifier used to prevent duplicate sends.',
    format: 'uuid',
  })
  @IsUUID('4')
  requestId: string;

  @ApiPropertyOptional({
    description: 'Spam honeypot. Human users leave this empty.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
