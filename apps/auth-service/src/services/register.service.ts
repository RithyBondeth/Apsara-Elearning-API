import { RegisterRequestDTO, RegisterResponseDTO } from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { user } from '@app/database/schemas/user/user.schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '@app/contracts';

@Injectable()
export class RegisterService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NeonHttpDatabase<any>,
    private readonly jwtService: JwtService,
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

    if (existingUser.length > 0) {
      throw new RpcException('User with this email already exists');
    }

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
      })
      .returning();

    // Generate tokens
    const accessToken = await this.jwtService.signAsync({
      sub: newUser.id,
      email: newUser.email,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: newUser.id,
        email: newUser.email,
      },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<any>('jwt.refreshExpires'),
      },
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
