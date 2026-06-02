import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: any) {
    const { email, password, username } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      username,
      password: hash,
    });

    const { password: _, ...result } = user;

    return result;
  }

  async login(dto: any) {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwt.sign(payload),
    };
  }
}