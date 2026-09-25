import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { DtoInit } from '../../types/dto-init';

export const TESTIMONIAL_QUOTE_MAX_LENGTH = 600;

export class CreateTestimonialRequestDTO {
  @ApiProperty({ example: 'Sophea K.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Grade 12 Chemistry teacher, Phnom Penh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  role: string;

  @ApiPropertyOptional({ example: 'គ្រូគីមីវិទ្យា ថ្នាក់ទី១២ ភ្នំពេញ' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  roleKm?: string;

  @ApiProperty({ maxLength: TESTIMONIAL_QUOTE_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(TESTIMONIAL_QUOTE_MAX_LENGTH)
  quote: string;

  @ApiPropertyOptional({ maxLength: TESTIMONIAL_QUOTE_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(TESTIMONIAL_QUOTE_MAX_LENGTH)
  quoteKm?: string;

  @ApiPropertyOptional({ example: 'star' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  avatar?: string;

  @ApiProperty({
    example: 'Signed consent form, Grade 12 pilot (Sept 2026)',
    description: 'How the person agreed to be quoted — required',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  consentSource: string;

  @ApiProperty({
    example: '2026-09-20',
    description:
      'Date consent was given (YYYY-MM-DD) — required, not in the future',
  })
  @IsDateString({ strict: true })
  consentedAt: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateTestimonialRequestDTO extends PartialType(
  CreateTestimonialRequestDTO,
) {}

/** Admin view — includes the consent record. */
export class TestimonialResponseDTO extends CreateTestimonialRequestDTO {
  constructor(partial: DtoInit<TestimonialResponseDTO> = {}) {
    super();
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

/** Public view for the landing page — the consent record stays internal. */
export class PublicTestimonialDTO {
  constructor(partial: DtoInit<PublicTestimonialDTO> = {}) {
    Object.assign(this, partial);
  }

  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiPropertyOptional() roleKm?: string | null;
  @ApiProperty() quote: string;
  @ApiPropertyOptional() quoteKm?: string | null;
  @ApiPropertyOptional() avatar?: string | null;
}
