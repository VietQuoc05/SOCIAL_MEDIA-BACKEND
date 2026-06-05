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
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/upload.config';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  // ============================
  // ✅ CREATE POST
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
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @HttpPost()
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  create(
    @CurrentUser() user: any,
    @UploadedFiles() files,
    @Body() dto: any,
  ) {
    if (!user) throw new UnauthorizedException();

    const images = files?.map(f => f.filename) || [];
    return this.service.create(user.id, { ...dto, images });
  }

  // ============================
  // ✅ GET POST DETAIL
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post detail' })
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
  // ✅ GET POSTS BY USER
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
  // ✅ FEED 🔥 (FIX 500 HERE)
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed' })
  @Get('feed')
  feed(@CurrentUser() user: any) {
    if (!user) {
      throw new UnauthorizedException(
        'Missing or invalid token',
      );
    }

    return this.service.getFeed(user.id);
  }
}
``