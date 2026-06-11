import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMaxSize,
  ArrayNotEmpty,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Hello world',
    description: 'Nội dung bài viết',
  })
  @IsString()
  caption: string;

  @ApiProperty({
    example: [
      '/social/image1.jpg',
      '/social/image2.jpg',
    ],
    description: 'Danh sách URL ảnh (tối đa 10 ảnh)',
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(10)
  images: string[];
}