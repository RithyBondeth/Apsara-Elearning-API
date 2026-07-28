import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  CreateEntitlementGrantRequestDTO,
  DRIZZLE,
  EntitlementGrantResponseDTO,
  IEntitlementAdminService,
} from '@app/contracts';
import {
  EntitlementService,
  RpcBadRequestException,
  RpcNotFoundException,
} from '@app/common';
import { userEntitlementGrants } from '@app/database/schemas/subscription/user-entitlement-grant.schema';

@Injectable()
export class EntitlementAdminService implements IEntitlementAdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>,
    private readonly entitlements: EntitlementService,
  ) {}

  resolve(userId: string) {
    return this.entitlements.resolveAll(userId);
  }

  async findGrants(userId: string): Promise<EntitlementGrantResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(userEntitlementGrants)
      .where(eq(userEntitlementGrants.userId, userId))
      .orderBy(userEntitlementGrants.createdAt);
    return rows.map((row) => new EntitlementGrantResponseDTO(row as any));
  }

  async grant(
    userId: string,
    grantedBy: string,
    dto: CreateEntitlementGrantRequestDTO,
  ) {
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= startsAt) {
      throw new RpcBadRequestException(
        'Grant expiration must be after its start',
      );
    }
    const [created] = await this.db
      .insert(userEntitlementGrants)
      .values({
        userId,
        grantedBy,
        entitlement: dto.entitlement,
        effect: dto.effect ?? 'allow',
        startsAt,
        expiresAt,
        reason: dto.reason,
      })
      .returning();
    return new EntitlementGrantResponseDTO(created as any);
  }

  async revoke(id: string) {
    const [revoked] = await this.db
      .update(userEntitlementGrants)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(userEntitlementGrants.id, id),
          isNull(userEntitlementGrants.revokedAt),
        ),
      )
      .returning();
    if (!revoked)
      throw new RpcNotFoundException('Active entitlement grant not found');
    return new EntitlementGrantResponseDTO(revoked as any);
  }
}
