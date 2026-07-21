import { TAvatarPreset } from '../../constants/domain/avatar.constant';
import {
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
} from '../../dtos/user/badge.dto';
import { UpdateUserRequestDTO } from '../../dtos/user/update-user.dto';

/**
 * DI tokens + contracts for the user-service business services. Controllers
 * depend on these; the module binds the concrete implementation.
 *
 * Returns are intentionally left as `unknown` — these methods resolve to
 * Drizzle row shapes that are re-typed at the gateway boundary via
 * `rpcCall<T>`, so pinning them here would only duplicate (and fight) the
 * inferred query types.
 */
export const I_USER_SERVICE = 'IUserService';
export const I_BADGE_SERVICE = 'IBadgeService';

export interface IUserService {
  findAll(): Promise<unknown>;
  findOne(id: string): Promise<unknown>;
  findByEmail(email: string): Promise<unknown>;
  update(id: string, dto: UpdateUserRequestDTO): Promise<unknown>;
  updateAvatar(id: string, avatar: TAvatarPreset): Promise<unknown>;
  remove(id: string): Promise<unknown>;
  addXp(id: string, amount: number): Promise<unknown>;
  updateStreak(id: string, reset?: boolean): Promise<unknown>;
}

export interface IBadgeService {
  create(dto: CreateBadgeRequestDTO): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(id: string): Promise<unknown>;
  update(id: string, dto: UpdateBadgeRequestDTO): Promise<unknown>;
  remove(id: string): Promise<unknown>;
  award(userId: string, badgeId: string): Promise<unknown>;
  findByUser(userId: string): Promise<unknown>;
}
