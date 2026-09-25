import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { desc, eq } from 'drizzle-orm';
import { testimonials } from '@app/database/schemas/course/testimonial.schema';
import {
  CreateTestimonialRequestDTO,
  DeleteResponseDTO,
  DRIZZLE,
  ITestimonialService,
  TestimonialResponseDTO,
  UpdateTestimonialRequestDTO,
} from '@app/contracts';
import { RpcBadRequestException, RpcNotFoundException } from '@app/common';

/**
 * Admin-managed quotes from real teachers, beta testers and partners. Every
 * row carries the consent record (source + date); the public landing payload
 * reads only published rows and never the consent fields.
 */
@Injectable()
export class TestimonialService implements ITestimonialService {
  private readonly logger = new Logger(TestimonialService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<any>) {}

  async create(
    dto: CreateTestimonialRequestDTO,
  ): Promise<TestimonialResponseDTO> {
    this.assertConsentDate(dto.consentedAt);
    const [created] = await this.db
      .insert(testimonials)
      .values({
        name: dto.name.trim(),
        role: dto.role.trim(),
        roleKm: dto.roleKm?.trim() || null,
        quote: dto.quote.trim(),
        quoteKm: dto.quoteKm?.trim() || null,
        avatar: dto.avatar || null,
        consentSource: dto.consentSource.trim(),
        consentedAt: dto.consentedAt,
        published: dto.published ?? false,
      })
      .returning();
    this.logger.log(`Testimonial ${created.id} created (${created.name})`);
    return new TestimonialResponseDTO(created);
  }

  async findAll(): Promise<TestimonialResponseDTO[]> {
    const rows = await this.db
      .select()
      .from(testimonials)
      .orderBy(desc(testimonials.createdAt));
    return rows.map((row) => new TestimonialResponseDTO(row));
  }

  async update(
    id: string,
    dto: UpdateTestimonialRequestDTO,
  ): Promise<TestimonialResponseDTO> {
    if (dto.consentedAt !== undefined) this.assertConsentDate(dto.consentedAt);
    const [updated] = await this.db
      .update(testimonials)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning();
    if (!updated) throw new RpcNotFoundException('Testimonial not found');
    return new TestimonialResponseDTO(updated);
  }

  async remove(id: string): Promise<DeleteResponseDTO> {
    const [deleted] = await this.db
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    if (!deleted) throw new RpcNotFoundException('Testimonial not found');
    return new DeleteResponseDTO({
      message: 'Testimonial deleted successfully',
      id: deleted.id,
    });
  }

  /** Consent recorded for a date that has not happened yet is not a record. */
  private assertConsentDate(value: string) {
    const today = new Date().toISOString().slice(0, 10);
    if (value > today) {
      throw new RpcBadRequestException('Consent date cannot be in the future');
    }
  }
}
