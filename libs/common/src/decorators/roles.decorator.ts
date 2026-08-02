import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../jwt/interfaces/jwt-payload.interface';

export const ROLES_KEY = 'authorization.roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
