import {
  Body,
  Controller,
  Delete,
  Get,
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
import { rpcCall } from '../utils/rpc-call';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Coding Challenges (Admin)')
@ApiBearerAuth()
@Controller()
export class ChallengeController {
  constructor(
    @Inject(ASSESSMENT_SERVICE.NAME) private readonly client: ClientProxy,
  ) {}

  // ---- Challenge ----
  @Post('lessons/:lessonId/challenges')
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
  findAll(@Param('lessonId') lessonId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ALL, {
      lessonId,
    });
  }

  @Get('challenges/:id')
  findOne(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_FIND_ONE, {
      id,
    });
  }

  @Patch('challenges/:id')
  update(@Param('id') id: string, @Body() body: UpdateChallengeRequestDTO) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_UPDATE, {
      id,
      ...body,
    });
  }

  @Delete('challenges/:id')
  remove(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.CHALLENGE_DELETE, {
      id,
    });
  }

  // ---- Test cases ----
  @Post('challenges/:challengeId/test-cases')
  createTestCase(
    @Param('challengeId') challengeId: string,
    @Body() body: CreateTestCaseRequestDTO,
  ) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_CREATE, {
      challengeId,
      ...body,
    });
  }

  // Admins see hidden test cases too.
  @Get('challenges/:challengeId/test-cases')
  findTestCases(@Param('challengeId') challengeId: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_FIND_ALL, {
      challengeId,
      includeHidden: true,
    });
  }

  @Patch('test-cases/:id')
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
  removeTestCase(@Param('id') id: string) {
    return rpcCall(this.client, ASSESSMENT_SERVICE.ACTIONS.TEST_CASE_DELETE, {
      id,
    });
  }
}
