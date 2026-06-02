import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // ✅ Check payload hợp lệ
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    // ✅ Map payload → user object chuẩn
    return {
      id: payload.sub,        // ✅ QUAN TRỌNG (fix lỗi user.id)
      email: payload.email,
    };
  }
}