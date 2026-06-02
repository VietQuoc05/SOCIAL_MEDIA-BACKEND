import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'test@gmail.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  password: string;

  @ApiProperty({ example: 'testuser' })
  username: string;
}