import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubmissionRequestDTO {
  @ApiProperty({ example: 'const [a,b]=input.split(" ").map(Number);console.log(a+b)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  sourceCode: string;

  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;
}
