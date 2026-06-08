import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
