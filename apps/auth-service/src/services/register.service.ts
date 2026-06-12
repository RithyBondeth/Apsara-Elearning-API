import { RegisterRequestDTO, RegisterResponseDTO } from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '@app/contracts';
import { EmailService, IJWTPayload, JwtService } from '@app/common';

@Injectable()
export class RegisterService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    registerRequestDTO: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      phone,
      dateOfBirth,
    } = registerRequestDTO;

    // Check existing credentials
    const existingUsers = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new RpcException('User with this email already exists');
    }

    // Generate email verification token
    const emailVerificationToken =
      await this.jwtService.generateEmailVerificationToken(email);

    // Set expiration for email token (default 1 hour)
    const emailVerificationTokenExpiresAt = new Date();
    emailVerificationTokenExpiresAt.setHours(
      emailVerificationTokenExpiresAt.getHours() + 1,
    );

    // Hash password
    const saltRounds = this.configService.get<number>('bcrypt.salt') ?? 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await this.db.transaction(async (tx) => {
      // Create user
      const [newUser] = await tx
        .insert(user)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          gender,
          phone,
          dateOfBirth:
            dateOfBirth instanceof Date
              ? dateOfBirth.toISOString()
              : dateOfBirth,
          emailVerificationToken,
          emailVerificationTokenExpiresAt,
        })
        .returning();

      // Generate tokens
      const jwtPayload: IJWTPayload = {
        id: newUser.id,
        info: newUser.email,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.generateToken(jwtPayload),
        this.jwtService.generateRefreshToken(newUser.id),
      ]);

      // Set refresh token expiration (default 7 days)
      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

      // Update user with refresh token and expiration
      await tx
        .update(user)
        .set({
          refreshToken,
          refreshTokenExpiresAt,
        })
        .where(eq(user.id, newUser.id));

      // Send email verification
      // Note: In a production environment, you might want to handle email failure gracefully
      // or move it to a background worker to avoid blocking the transaction/request.
      await this.emailService.sendVerificationEmail(
        email,
        emailVerificationToken,
      );

      return new RegisterResponseDTO({
        message: 'User registered successfully',
        accessToken,
        refreshToken,
      });
    });
  }
}
