import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProgrammingCategoryRequestDTO {
  @ApiProperty({ example: 'Web Development' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'ការអភិវឌ្ឍន៍គេហទំព័រ' })
  @IsString()
  @IsOptional()
  nameKm?: string;

  @ApiProperty({ example: 'web-development' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    example: 'Build websites and web apps with HTML, CSS, JavaScript and React',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'បង្កើតគេហទំព័រ និងកម្មវិធីវេប',
  })
  @IsString()
  @IsOptional()
  descriptionKm?: string;

  @ApiPropertyOptional({ example: 'code-2' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateProgrammingCategoryRequestDTO extends PartialType(
  CreateProgrammingCategoryRequestDTO,
) {}

export class ProgrammingCategoryResponseDTO extends CreateProgrammingCategoryRequestDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
