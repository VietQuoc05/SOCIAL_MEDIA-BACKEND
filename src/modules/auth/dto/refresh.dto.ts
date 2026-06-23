import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'a1b2c3d4...',
    description: 'Refresh token',
  })
  @IsString()
  refresh_token: string;
}