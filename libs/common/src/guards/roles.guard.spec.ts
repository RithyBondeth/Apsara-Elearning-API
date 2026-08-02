import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IJWTPayload } from '../jwt/interfaces/jwt-payload.interface';
import { RolesGuard } from './roles.guard';

function contextFor(user?: IJWTPayload): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  it('allows an authenticated user with a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const admin: IJWTPayload = {
      id: 'admin-1',
      info: 'admin@example.com',
      type: 'access',
      role: 'admin',
    };
    expect(guard.canActivate(contextFor(admin))).toBe(true);
  });

  it('rejects a user without a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const student: IJWTPayload = {
      id: 'student-1',
      info: 'student@example.com',
      type: 'access',
      role: 'student',
    };
    expect(() => guard.canActivate(contextFor(student))).toThrow(
      ForbiddenException,
    );
  });

  it('allows routes that do not declare role requirements', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor())).toBe(true);
  });
});
