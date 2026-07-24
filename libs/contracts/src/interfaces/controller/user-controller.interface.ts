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
 * RPC controller contracts for user-service — one per resource domain (user,
 * badge), each holding that domain's actions.
 */
export interface IUserRpcController {
  findAll(): Promise<UserResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<UserResponseDTO>;
  findByEmail(payload: string | { email: string }): Promise<UserResponseDTO>;
  update(
    payload: UpdateUserRequestDTO & { id: string },
  ): Promise<UserResponseDTO>;
  updateAvatar(payload: {
    id: string;
    avatar: TAvatarPreset;
  }): Promise<UserResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  addXp(payload: { userId: string; amount: number }): Promise<AddXpResponseDTO>;
  updateStreak(payload: {
    userId: string;
    reset?: boolean;
  }): Promise<UserResponseDTO>;
}

export interface IBadgeRpcController {
  create(dto: CreateBadgeRequestDTO): Promise<BadgeResponseDTO>;
  findAll(): Promise<BadgeResponseDTO[]>;
  findOne(payload: string | { id: string }): Promise<BadgeResponseDTO>;
  update(
    payload: UpdateBadgeRequestDTO & { id: string },
  ): Promise<BadgeResponseDTO>;
  remove(payload: string | { id: string }): Promise<DeleteResponseDTO>;
  award(payload: {
    userId: string;
    badgeId: string;
  }): Promise<AwardBadgeResponseDTO>;
  findByUser(
    payload: string | { userId: string },
  ): Promise<UserBadgeResponseDTO[]>;
}
