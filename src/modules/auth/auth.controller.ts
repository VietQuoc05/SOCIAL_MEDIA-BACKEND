import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth') // ✅ group trong Swagger
@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

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
  @ApiResponse({ status: 200, description: 'Login successful, return JWT token' })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
}