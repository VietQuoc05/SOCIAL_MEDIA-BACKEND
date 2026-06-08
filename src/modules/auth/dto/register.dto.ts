import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  // ✅ giữ username (Tiếng Việt)
  @ApiProperty({ example: 'Nguyễn Quốc' })
  @IsString()
  username: string;

  // ✅ NEW: displayName (IG style)
  @ApiProperty({
    example: 'cosouq.vt',
    description:
      'Lowercase, no special chars except dot, min length 6',
  })
  @IsString()
  @MinLength(6) // ✅ enforce min length
  displayName: string;
}