import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ASSESSMENT_SERVICE,
  CreateChallengeRequestDTO,
  CreateTestCaseRequestDTO,
  UpdateChallengeRequestDTO,
  UpdateTestCaseRequestDTO,
} from '@app/contracts';
import { rpcCall } from '@app/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Coding Challenges (Admin)')
@ApiBearerAuth()
@Controller()
export class ChallengeController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Challenge ----
  @Post('lessons/:lessonId/challenges')
  @ApiOperation({ summary: 'Create a new coding challenge for a lesson' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Challenge created' })
  create(
    @Param('lessonId') lessonId: string,
    @Body() body: CreateChallengeRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_CREATE, {
      lessonId,
      ...body,
    });
  }

  @Get('lessons/:lessonId/challenges')
  @ApiOperation({ summary: 'Get all challenges for a lesson' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenges retrieved' })
  findAll(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ALL, {
      lessonId,
    });
  }

  @Get('challenges/:id')
  @ApiOperation({ summary: 'Get a challenge by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge retrieved' })
  findOne(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ONE, {
      id,
    });
  }

  @Patch('challenges/:id')
  @ApiOperation({ summary: 'Update a challenge' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge updated' })
  update(@Param('id') id: string, @Body() body: UpdateChallengeRequestDTO) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('challenges/:id')
  @ApiOperation({ summary: 'Delete a challenge' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Challenge deleted' })
  remove(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_DELETE, {
      id,
    });
  }

  // ---- Test cases ----
  @Post('challenges/:challengeId/test-cases')
  @ApiOperation({ summary: 'Create a new test case for a challenge' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Test case created' })
  createTestCase(
    @Param('challengeId') challengeId: string,
    @Body() body: CreateTestCaseRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_CREATE, {
      challengeId,
      ...body,
    });
  }

  @Get('challenges/:challengeId/test-cases')
  @ApiOperation({
    summary: 'Get all test cases (including hidden) for a challenge',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test cases retrieved' })
  findTestCases(@Param('challengeId') challengeId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_ALL, {
      challengeId,
      includeHidden: true,
    });
  }

  @Patch('test-cases/:id')
  @ApiOperation({ summary: 'Update a test case' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test case updated' })
  updateTestCase(
    @Param('id') id: string,
    @Body() body: UpdateTestCaseRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('test-cases/:id')
  @ApiOperation({ summary: 'Delete a test case' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test case deleted' })
  removeTestCase(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_DELETE, {
      id,
    });
  }
}
