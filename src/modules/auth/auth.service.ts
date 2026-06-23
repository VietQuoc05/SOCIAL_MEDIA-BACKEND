import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RefreshToken } from '../../database/entities/refresh-token.entity';

// ✅ util normalize
function normalizeDisplayName(input: string) {
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');

  if (cleaned.length < 6) {
    throw new BadRequestException(
      'DisplayName must be at least 6 characters',
    );
  }

  return cleaned;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  // ============================
  // ✅ REGISTER
  // ============================
  async register(dto: RegisterDto) {
    const { email, password, username, displayName } = dto;

    const normalizedDisplayName =
      normalizeDisplayName(displayName);

    const existing =
      await this.usersService.findByEmailOrDisplayName(
        email,
        normalizedDisplayName,
      );

    if (existing) {
      throw new BadRequestException(
        'Email or displayName already exists',
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      username,
      displayName: normalizedDisplayName,
      password: hash,
    });

    const { password: _, ...result } = user;
    return result;
  }

  // ============================
  // ✅ GENERATE TOKENS
  // ============================
  private async generateTokens(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };

    const access_token = this.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const rawToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '7', 10),
    );

    await this.refreshTokenRepo.save({
      token: rawToken,
      userId: user.id,
      expiresAt,
    });

    return {
      access_token,
      refresh_token: rawToken,
    };
  }

  // ============================
  // ✅ LOGIN
  // ============================
  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(
      password,
      user.password,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  // ============================
  // ✅ REFRESH
  // ============================
  async refresh(dto: RefreshDto) {
    const { refresh_token } = dto;

    const existing = await this.refreshTokenRepo.findOne({
      where: { token: refresh_token },
      relations: ['user'],
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > existing.expiresAt) {
      await this.refreshTokenRepo.remove(existing);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Xoá refresh token cũ (rotation)
    await this.refreshTokenRepo.remove(existing);

    return this.generateTokens(existing.user);
  }
}
