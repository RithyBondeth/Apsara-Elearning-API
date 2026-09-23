import { Controller, Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ILeaderboardHttpController,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  USER_SERVICE,
} from '@app/contracts';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, rpcCall } from '@app/common';

/**
 * The XP leaderboard.
 *
 * Authenticated rather than public on purpose: the board names learners, and
 * this platform teaches Grade 1–12, so the rows stay behind a sign-in and carry
 * only a first name plus last initial (see LeaderboardEntryDTO).
 */
@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController implements ILeaderboardHttpController {
  constructor(
    @Inject(USER_SERVICE.NAME) private readonly userClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the XP leaderboard with the current learner’s standing',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Top learners by XP, plus the caller’s own row even when they rank below the page',
    type: LeaderboardResponseDTO,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: LeaderboardQueryDTO,
  ): Promise<LeaderboardResponseDTO> {
    return rpcCall<LeaderboardResponseDTO>(
      this.userClient,
      USER_SERVICE.ACTIONS.LEADERBOARD,
      { viewerId: userId, limit: query.limit },
    );
  }
}
