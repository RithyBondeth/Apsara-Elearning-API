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
    const { email, password, firstName, lastName, phone, dateOfBirth } =
      registerRequestDTO;

    // Check existing credentials
    const existingUser = await this.db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser)
      throw new RpcException('User with this email already exists');

    // Generate email verification token
    const emailVerificationToken =
      await this.jwtService.generateEmailVerificationToken(email);

    // Hash password
    const saltRounds = this.configService.get<number>('bcrypt.salt') ?? 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await this.db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth.toISOString(),
        emailVerificationToken,
      })
      .returning();

    // Generate accessToken and refreshToken
    const jwtPayload: IJWTPayload = {
      id: newUser.id,
      info: newUser.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateToken(jwtPayload),
      this.jwtService.generateRefreshToken(newUser.id),
    ]);

    // Send email verification email
    await this.emailService.sendVerificationEmail(
      email,
      emailVerificationToken,
    );

    // Update refresh token in DB
    await this.db
      .update(user)
      .set({ refreshToken })
      .where(eq(user.id, newUser.id));

    return new RegisterResponseDTO({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  }
}
