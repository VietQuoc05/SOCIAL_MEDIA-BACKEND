import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register')
  register(@Body() dto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto) {
    return this.service.login(dto);
  }
}