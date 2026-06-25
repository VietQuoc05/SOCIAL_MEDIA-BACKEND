import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // ✅ REGISTER
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  // ✅ LOGIN
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, return access + refresh tokens',
  })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  // ✅ REFRESH
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'New access + refresh tokens returned',
  })
  refresh(@Body() dto: RefreshDto) {
    return this.service.refresh(dto);
  }

  // ✅ VERIFY EMAIL
  @Get('verify')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  verifyEmail(@Query('token') token: string) {
    return this.service.verifyEmail(token);
  }

  // ✅ FORGOT PASSWORD
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto);
  }

  // ✅ RESET PASSWORD
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }
}