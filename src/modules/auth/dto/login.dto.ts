import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'Email đăng nhập',
  })
  @IsEmail() // ✅ QUAN TRỌNG
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu',
  })
  @IsString() // ✅ QUAN TRỌNG
  password: string;
}