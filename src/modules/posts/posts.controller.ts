import {
  Controller,
  Post as HttpPost,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
  Query,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { UploadService } from '../uploads/upload.service'; // ✅ FIX PATH

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

import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/upload.config';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly service: PostsService,
    private readonly uploadService: UploadService,
  ) {}

  // ============================
  // ✅ CREATE POST (UPLOAD MINIO)
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @HttpPost()
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  async create(
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any,
  ) {
    if (!user) throw new UnauthorizedException();

    const uploadedImages = files?.length
      ? await this.uploadService.uploadMultiple(files)
      : [];

    return this.service.create(user.id, {
      ...dto,
      images: uploadedImages,
    });
  }

  // ============================
  // ✅ FEED (INFINITE SCROLL)
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get feed (infinite scroll with cursor)',
  })
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

  // ============================
  // ✅ GET MY POSTS
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMyPosts(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();

    return this.service.findByUser(user.id, user.id);
  }

  // ============================
  // ✅ POSTS BY USER
  // ============================
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

  // ============================
  // ✅ GET ALL POSTS
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  findAll(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();

    return this.service.findAll(user.id);
  }

  // ============================
  // ✅ GET POST DETAIL
  // ============================
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

  // ============================
  // ✅ UPDATE POST
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    if (!user) throw new UnauthorizedException();

    return this.service.update(id, user.id, dto);
  }

  // ============================
  // ✅ DELETE POST
  // ============================
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
``