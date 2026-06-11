import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Nice post!',
    description: 'Nội dung comment',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: '/social/comment.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    example: 'parent-comment-id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}