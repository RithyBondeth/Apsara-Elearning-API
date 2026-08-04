import { TAvatarPreset } from '../../constants/domain/avatar.constant';
import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  AwardBadgeResponseDTO,
  BadgeResponseDTO,
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
  UserBadgeResponseDTO,
} from '../../dtos/user/badge.dto';
import { UpdateUserRequestDTO } from '../../dtos/user/update-user.dto';
import {
  AddXpResponseDTO,
  UserResponseDTO,
} from '../../dtos/user/user-response.dto';

/**
 * DI tokens + contracts for the user-service business services. Controllers
 * depend on these; the module binds the concrete implementation.
 */
export const I_USER_SERVICE = 'IUserService';
export const I_BADGE_SERVICE = 'IBadgeService';

export interface IUserService {
  findAll(): Promise<UserResponseDTO[]>;
  findOne(id: string): Promise<UserResponseDTO>;
  findByEmail(email: string): Promise<UserResponseDTO>;
  update(id: string, dto: UpdateUserRequestDTO): Promise<UserResponseDTO>;
  updateAvatar(id: string, avatar: TAvatarPreset): Promise<UserResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  addXp(id: string, amount: number): Promise<AddXpResponseDTO>;
  updateStreak(id: string, streak: number): Promise<UserResponseDTO>;
}

export interface IBadgeService {
  create(dto: CreateBadgeRequestDTO): Promise<BadgeResponseDTO>;
  findAll(): Promise<BadgeResponseDTO[]>;
  findOne(id: string): Promise<BadgeResponseDTO>;
  update(id: string, dto: UpdateBadgeRequestDTO): Promise<BadgeResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  award(userId: string, badgeId: string): Promise<AwardBadgeResponseDTO>;
  findByUser(userId: string): Promise<UserBadgeResponseDTO[]>;
}
