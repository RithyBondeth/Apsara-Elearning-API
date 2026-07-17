import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFacultyRequestDTO {
  @ApiProperty({ example: 'Faculty of Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'មហាវិទ្យាល័យវិស្វកម្ម' })
  @IsString()
  @IsOptional()
  nameKm?: string;

  @ApiProperty({ example: 'engineering' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Engineering disciplines and programs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'cpu' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateFacultyRequestDTO extends PartialType(
  CreateFacultyRequestDTO,
) {}

export class FacultyResponseDTO extends CreateFacultyRequestDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
