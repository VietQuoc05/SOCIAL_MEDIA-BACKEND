import {
  Controller,
  Post as HttpPost,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { UploadService } from '../uploads/upload.service';
import { S3Service } from '../uploads/s3.service';

import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly service: PostsService,
    private readonly uploadService: UploadService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo post mới với upload ảnh qua presigned URL' })
  @HttpPost()
  async create(
    @CurrentUser() user: any,
    @Body() dto: { caption: string; images: string[] },
  ) {
    if (!user) throw new UnauthorizedException();

    if (!dto.caption) {
      throw new BadRequestException('Caption is required');
    }

    if (!Array.isArray(dto.images) || dto.images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (dto.images.length > 10) {
      throw new BadRequestException('Max 10 images allowed');
    }

    return this.service.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feed (infinite scroll with cursor)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('feed')
  feed(
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    if (!user) throw new UnauthorizedException();

    return this.service.getFeed(
      user.id,
      cursor,
      Number(limit) || 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMyPosts(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();

    return this.service.findByUser(user.id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/:id')
  findByUser(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user) throw new UnauthorizedException();

    return this.service.findByUser(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();

    return this.service.findAll(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id' })
  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user) throw new UnauthorizedException();

    return this.service.findById(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: { caption?: string; images?: string[] },
  ) {
    if (!user) throw new UnauthorizedException();

    if (dto.images) {
      dto.images = dto.images.map(key => this.s3Service.getPublicUrl(key));
    }

    return this.service.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user) throw new UnauthorizedException();

    return this.service.delete(id, user.id);
  }
}
