import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
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
import { PendingUser } from '../../database/entities/pending-user.entity';
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

    @InjectRepository(PendingUser)
    private pendingUserRepo: Repository<PendingUser>,
  ) {}

  // ============================
  // ✅ REGISTER (lưu tạm PendingUser, chưa tạo tài khoản thật)
  // ============================
  async register(dto: RegisterDto) {
    const { email, password, username, displayName } = dto;

    const normalizedDisplayName =
      normalizeDisplayName(displayName);

    // Kiểm tra email đã có trong User thật chưa
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Kiểm tra displayName đã có trong User thật chưa
    const existingDisplayName = await this.userRepo.findOne({
      where: { displayName: normalizedDisplayName },
    });
    if (existingDisplayName) {
      throw new BadRequestException('DisplayName already exists');
    }

    // Kiểm tra email đã có trong PendingUser chưa
    const existingPending = await this.pendingUserRepo.findOne({
      where: { email },
    });
    if (existingPending) {
      throw new BadRequestException(
        'This email is already pending verification. Please check your inbox or request a new verification email.',
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const verifyToken = uuidv4();

    // Lưu vào PendingUser (chưa tạo tài khoản thật)
    await this.pendingUserRepo.save({
      email,
      password: hash,
      username,
      displayName: normalizedDisplayName,
      verifyToken,
    });

    // Gửi email verify (fire & forget)
    this.mailService.sendVerifyEmail(email, verifyToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return {
      message:
        'Please check your email to verify your account. Your account will be created after verification.',
    };
  }

  // ============================
  // ✅ RESEND VERIFY EMAIL (cho PendingUser hoặc User chưa verify)
  // ============================
  async resendVerifyEmail(dto: ForgotPasswordDto) {
    const { email } = dto;

    // Kiểm tra User cũ (isVerified=false)
    const user = await this.userRepo.findOne({
      where: { email, isDeleted: false, isVerified: false },
    });

    if (user) {
      const verifyToken = uuidv4();
      user.verifyToken = verifyToken;
      await this.userRepo.save(user);

      this.mailService.sendVerifyEmail(email, verifyToken).catch((err) => {
        console.error('Failed to resend verification email:', err);
      });

      return {
        message:
          'If that email is registered and not verified, a verification link has been sent.',
      };
    }

    // Kiểm tra PendingUser (register flow mới)
    const pending = await this.pendingUserRepo.findOne({
      where: { email },
    });

    if (pending) {
      const verifyToken = uuidv4();
      pending.verifyToken = verifyToken;
      await this.pendingUserRepo.save(pending);

      this.mailService.sendVerifyEmail(email, verifyToken).catch((err) => {
        console.error('Failed to resend verification email:', err);
      });
    }

    return {
      message:
        'If that email is registered and not verified, a verification link has been sent.',
    };
  }

  // ============================
  // ✅ VERIFY EMAIL (tìm trong PendingUser hoặc User cũ)
  // ============================
  async verifyEmail(token: string) {
    // TH1: Kiểm tra PendingUser (register flow mới)
    const pending = await this.pendingUserRepo.findOne({
      where: { verifyToken: token },
    });

    if (pending) {
      // Kiểm tra email đã tồn tại trong User chưa (tránh race condition)
      const existingUser = await this.usersService.findByEmail(pending.email);
      if (existingUser) {
        // Nếu user đã tồn tại, xoá pending và verify user đó
        existingUser.isVerified = true;
        existingUser.verifyToken = null;
        await this.userRepo.save(existingUser);
        await this.pendingUserRepo.remove(pending);
        return { message: 'Email verified successfully. You can now log in.' };
      }

      // Tạo User thật từ PendingUser
      await this.usersService.create({
        email: pending.email,
        password: pending.password,
        username: pending.username,
        displayName: pending.displayName,
        isVerified: true,
        verifyToken: null,
      });

      // Xoá PendingUser
      await this.pendingUserRepo.remove(pending);

      return { message: 'Email verified successfully. You can now log in.' };
    }

    // TH2: Kiểm tra User cũ (tạo trước khi có pending flow, isVerified=false)
    const user = await this.userRepo.findOne({
      where: { verifyToken: token, isDeleted: false },
    });

    if (user) {
      user.isVerified = true;
      user.verifyToken = null;
      await this.userRepo.save(user);

      return { message: 'Email verified successfully. You can now log in.' };
    }

    throw new BadRequestException('Invalid or expired verification token');
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
    const fullUser = await this.userRepo.findOne({
      where: { id: user.id },
    });

    if (!fullUser.isVerified) {
      // Tự động gửi lại verification email
      const verifyToken = uuidv4();
      fullUser.verifyToken = verifyToken;
      await this.userRepo.save(fullUser);

      this.mailService.sendVerifyEmail(email, verifyToken).catch((err) => {
        console.error('Failed to send verification email:', err);
      });

      throw new UnauthorizedException(
        'Email not verified. A new verification link has been sent to your email.',
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