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
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<{
      userEntitlementGrants: typeof userEntitlementGrants;
    }>,
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
    return rows.map((row) => this.toDTO(row));
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
    return this.toDTO(created);
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
    return this.toDTO(revoked);
  }

  private toDTO(
    row: typeof userEntitlementGrants.$inferSelect,
  ): EntitlementGrantResponseDTO {
    return new EntitlementGrantResponseDTO({
      ...row,
      entitlement: row.entitlement,
      effect: row.effect,
    });
  }
}
