import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AdminCertificateDTO,
  AdminCertificateQueryDTO,
  COURSE_SERVICE,
  RevokeCertificateRequestDTO,
} from '@app/contracts';
import { CurrentUser, rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Certificate moderation. Revoking makes public verification report the
 * certificate as invalid; the reason is recorded and shown to its holder but
 * never on the public page.
 */
@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates')
export class CertificateController {
  constructor(
    @Inject(COURSE_SERVICE.NAME) private readonly courseClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search issued certificates by code, learner or course',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [AdminCertificateDTO] })
  findAll(
    @Query() query: AdminCertificateQueryDTO,
  ): Promise<AdminCertificateDTO[]> {
    return rpcCall<AdminCertificateDTO[]>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_ADMIN_LIST,
      { q: query.q },
    );
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Withdraw a certificate, with a reason' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminCertificateDTO })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Already revoked, or no reason given',
  })
  revoke(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RevokeCertificateRequestDTO,
  ): Promise<AdminCertificateDTO> {
    return rpcCall<AdminCertificateDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_REVOKE,
      { id, actorId, reason: body.reason },
    );
  }

  @Patch(':id/reinstate')
  @ApiOperation({ summary: 'Undo a revocation' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminCertificateDTO })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Certificate is not revoked',
  })
  reinstate(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminCertificateDTO> {
    return rpcCall<AdminCertificateDTO>(
      this.courseClient,
      COURSE_SERVICE.ACTIONS.CERTIFICATE_REINSTATE,
      { id, actorId },
    );
  }
}
