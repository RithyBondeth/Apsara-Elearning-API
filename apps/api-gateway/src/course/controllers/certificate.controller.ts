import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CertificateResponseDTO,
  CertificateVerificationResponseDTO,
  COURSE_SERVICE,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard, rpcCall } from '@app/common';

@ApiTags('Certificates')
@Controller('certificate')
export class CertificateController {
  constructor(
    @Inject(COURSE_SERVICE.NAME)
    private readonly courseClient: ClientProxy,
  ) {}

  /**
   * Public on purpose — the point of a certificate code is that an employer can
   * check it without an account. Unknown codes return `valid: false` rather than
   * 404, so nobody can probe which codes exist.
   */
  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a certificate by its public code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification result',
    type: CertificateVerificationResponseDTO,
  })
  verify(
    @Param('code') code: string,
  ): Promise<CertificateVerificationResponseDTO> {
    return rpcCall<CertificateVerificationResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_VERIFY,
      { code },
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the signed-in learner's certificates" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificates retrieved',
    type: [CertificateResponseDTO],
  })
  findMine(
    @CurrentUser('id') userId: string,
  ): Promise<CertificateResponseDTO[]> {
    return rpcCall<CertificateResponseDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_FIND_BY_USER,
      { userId },
    );
  }

  /**
   * Claim the certificate for a completed course. Issuing also happens
   * automatically on completion; this exists for the learner who finished a
   * course before subscribing, and is idempotent either way.
   */
  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue or claim the certificate for a course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Certificate issued or already held',
    type: CertificateResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Course is not finished yet',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Plan does not include certificates',
  })
  issue(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CertificateResponseDTO> {
    return rpcCall<CertificateResponseDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_ISSUE,
      { userId, courseId },
    );
  }
}
