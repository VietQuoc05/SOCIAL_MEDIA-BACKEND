import {
  Controller,
  Post as HttpPost,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  // ============================
  // ✅ CREATE POST
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @HttpPost()
  create(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.service.create(user.id, dto); // ✅ FIX QUAN TRỌNG
  }

  // ============================
  // ✅ UPDATE POST
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreatePostDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  // ============================
  // ✅ DELETE POST
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id);
  }

  // ============================
  // ✅ GET ALL POSTS
  // ============================
  @ApiOperation({ summary: 'Get all posts' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ============================
  // ✅ GET MY POSTS
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my posts' })
  @Get('me')
  getMyPosts(@CurrentUser() user: any) {
    return this.service.findByUser(user.id);
  }

  // ============================
  // ✅ GET POSTS BY USER
  // ============================
  @ApiOperation({ summary: 'Get posts by user' })
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.service.findByUser(id);
  }

  // ============================
  // ✅ FEED
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed' })
  @Get('feed')
  feed(@CurrentUser() user: any) {
    return this.service.getFeed(user.id);
  }
}