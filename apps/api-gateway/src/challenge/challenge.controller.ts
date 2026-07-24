import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  ChallengeResponseDTO,
  CreateSubmissionRequestDTO,
  IChallengeHttpController,
  SubmissionResponseDTO,
  SubmissionResultResponseDTO,
  TestCaseResponseDTO,
} from '@app/contracts';
import { CurrentUser, JwtAuthGuard } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { rpcCall } from '@app/common';

@ApiTags('Coding Challenges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('challenge')
export class ChallengeController implements IChallengeHttpController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME)
    private readonly challengeClient: ClientProxy,
  ) {}

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get all challenges for a specific lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Challenges retrieved successfully',
    type: [ChallengeResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findByLesson(
    @Param('lessonId') lessonId: string,
  ): Promise<ChallengeResponseDTO[]> {
    return rpcCall<ChallengeResponseDTO[]>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ALL,
      { lessonId },
    );
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get current user submissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions retrieved successfully',
    type: [SubmissionResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  mySubmissions(
    @CurrentUser('id') userId: string,
  ): Promise<SubmissionResponseDTO[]> {
    return rpcCall<SubmissionResponseDTO[]>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ALL,
      { userId },
    );
  }

  @Get('submission/:id')
  @ApiOperation({ summary: 'Get a specific submission by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission retrieved successfully',
    type: SubmissionResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Submission not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  submission(@Param('id') id: string): Promise<SubmissionResponseDTO> {
    return rpcCall<SubmissionResponseDTO>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_FIND_ONE,
      { id },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific challenge by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Challenge retrieved successfully',
    type: ChallengeResponseDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Challenge not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<ChallengeResponseDTO> {
    const challenge = await rpcCall<ChallengeResponseDTO>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ONE,
      { id },
    );
    if (challenge) delete challenge.solutionCode;
    return challenge;
  }

  @Get(':id/test-cases')
  @ApiOperation({ summary: 'Get visible test cases for a challenge' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test cases retrieved successfully',
    type: [TestCaseResponseDTO],
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  testCases(@Param('id') id: string): Promise<TestCaseResponseDTO[]> {
    return rpcCall<TestCaseResponseDTO[]>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_ALL,
      { challengeId: id },
    );
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a solution for a challenge' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solution submitted and evaluated',
    type: SubmissionResultResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  submit(
    @CurrentUser('id') userId: string,
    @Param('id') challengeId: string,
    @Body() dto: CreateSubmissionRequestDTO,
  ): Promise<SubmissionResultResponseDTO> {
    return rpcCall<SubmissionResultResponseDTO>(
      this.challengeClient,
      ASSESSMENT_SERVICE.ACTIONS.SUBMISSION_CREATE,
      {
        userId,
        challengeId,
        sourceCode: dto.sourceCode,
        language: dto.language,
      },
    );
  }
}
