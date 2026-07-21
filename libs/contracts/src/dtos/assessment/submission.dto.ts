import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubmissionRequestDTO {
  @ApiProperty({
    example: 'const [a,b]=input.split(" ").map(Number);console.log(a+b)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  sourceCode: string;

  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class SubmissionResponseDTO extends CreateSubmissionRequestDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
