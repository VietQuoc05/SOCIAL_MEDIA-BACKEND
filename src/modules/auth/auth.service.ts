import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { User } from '../../database/entities/user.entity';
import { MailService } from '../mail/mail.service';

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
    private mailService: MailService,

    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
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

    const verifyToken = uuidv4();

    const user = await this.usersService.create({
      email,
      username,
      displayName: normalizedDisplayName,
      password: hash,
      isVerified: false,
      verifyToken,
    });

    // Gửi email verify (fire & forget - không block response)
    this.mailService.sendVerifyEmail(email, verifyToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    const { password: _, ...result } = user;
    return {
      ...result,
      message:
        'Account created. Please check your email to verify your account.',
    };
  }

  // ============================
  // ✅ VERIFY EMAIL
  // ============================
  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isVerified) {
      return { message: 'Email already verified. You can log in.' };
    }

    user.isVerified = true;
    user.verifyToken = null; // clear token after use
    await this.userRepo.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
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

    // ✅ CHECK: Email đã verify chưa?
    // Cần fetch lại user để có isVerified (findByEmail select limited fields)
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
    });

    if (!fullUser.isVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox.',
      );
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

  // ============================
  // ✅ FORGOT PASSWORD
  // ============================
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.userRepo.findOne({
      where: { email, isDeleted: false },
    });

    // Không tiết lộ user có tồn tại hay không (bảo mật)
    if (!user) {
      return {
        message:
          'If that email is registered, you will receive a password reset link.',
      };
    }

    // Tạo reset token (hết hạn sau 15 phút)
    const resetToken = uuidv4();
    user.resetToken = resetToken;
    user.resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepo.save(user);

    // Gửi email reset password (fire & forget)
    this.mailService.sendResetPasswordEmail(email, resetToken).catch((err) => {
      console.error('Failed to send reset password email:', err);
    });

    return {
      message:
        'If that email is registered, you will receive a password reset link.',
    };
  }

  // ============================
  // ✅ RESET PASSWORD
  // ============================
  async resetPassword(dto: ResetPasswordDto) {
    const { token, password } = dto;

    const user = await this.userRepo.findOne({
      where: { resetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetTokenExpire && new Date() > user.resetTokenExpire) {
      // Clear expired token
      user.resetToken = null;
      user.resetTokenExpire = null;
      await this.userRepo.save(user);
      throw new BadRequestException('Reset token has expired');
    }

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await this.userRepo.save(user);

    return { message: 'Password has been reset successfully.' };
  }
}