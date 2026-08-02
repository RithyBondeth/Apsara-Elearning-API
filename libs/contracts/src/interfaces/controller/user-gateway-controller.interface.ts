import { DeleteResponseDTO } from '../../dtos/common/delete-response.dto';
import {
  AwardBadgeResponseDTO,
  BadgeResponseDTO,
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
  UserBadgeResponseDTO,
} from '../../dtos/user/badge.dto';
import {
  UpdateAvatarRequestDTO,
  UpdateUserRequestDTO,
} from '../../dtos/user/update-user.dto';
import { UserResponseDTO } from '../../dtos/user/user-response.dto';

/**
 * HTTP gateway controller contracts for the user domain. `*HttpController`
 * back the public api-gateway; `Admin*Controller` back the admin-gateway.
 */

// ---- Public (api-gateway) ----

export interface IUserHttpController {
  getProfile(userId: string): Promise<UserResponseDTO>;
  updateProfile(
    userId: string,
    dto: UpdateUserRequestDTO,
  ): Promise<UserResponseDTO>;
  updateAvatar(
    userId: string,
    dto: UpdateAvatarRequestDTO,
  ): Promise<UserResponseDTO>;
  getMyBadges(userId: string): Promise<UserBadgeResponseDTO[]>;
}

export interface IBadgeHttpController {
  findAll(): Promise<BadgeResponseDTO[]>;
}

// ---- Admin (admin-gateway) ----

export interface IAdminUserController {
  findAll(): Promise<UserResponseDTO[]>;
  findOne(id: string): Promise<UserResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
}

export interface IAdminBadgeController {
  create(dto: CreateBadgeRequestDTO): Promise<BadgeResponseDTO>;
  findAll(): Promise<BadgeResponseDTO[]>;
  findOne(id: string): Promise<BadgeResponseDTO>;
  update(id: string, dto: UpdateBadgeRequestDTO): Promise<BadgeResponseDTO>;
  remove(id: string): Promise<DeleteResponseDTO>;
  award(id: string, userId: string): Promise<AwardBadgeResponseDTO>;
}
