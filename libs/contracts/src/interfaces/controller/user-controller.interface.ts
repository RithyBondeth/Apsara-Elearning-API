import { TAvatarPreset } from '../../constants/domain/avatar.constant';
import {
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
} from '../../dtos/user/badge.dto';
import { UpdateUserRequestDTO } from '../../dtos/user/update-user.dto';

/**
 * RPC controller contracts for user-service — one per resource domain (user,
 * badge), each holding that domain's actions, mirroring the reference's
 * per-domain controller split for CRUD services.
 */
export interface IUserRpcController {
  findAll(): Promise<unknown>;
  findOne(payload: string | { id: string }): Promise<unknown>;
  findByEmail(payload: string | { email: string }): Promise<unknown>;
  update(payload: UpdateUserRequestDTO & { id: string }): Promise<unknown>;
  updateAvatar(payload: { id: string; avatar: TAvatarPreset }): Promise<unknown>;
  remove(payload: string | { id: string }): Promise<unknown>;
  addXp(payload: { userId: string; amount: number }): Promise<unknown>;
  updateStreak(payload: { userId: string; reset?: boolean }): Promise<unknown>;
}

export interface IBadgeRpcController {
  create(dto: CreateBadgeRequestDTO): Promise<unknown>;
  findAll(): Promise<unknown>;
  findOne(payload: string | { id: string }): Promise<unknown>;
  update(payload: UpdateBadgeRequestDTO & { id: string }): Promise<unknown>;
  remove(payload: string | { id: string }): Promise<unknown>;
  award(payload: { userId: string; badgeId: string }): Promise<unknown>;
  findByUser(payload: string | { userId: string }): Promise<unknown>;
}
