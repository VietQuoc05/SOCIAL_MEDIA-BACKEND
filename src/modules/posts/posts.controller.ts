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

@Controller('posts')
export class PostsController {
  constructor(private service: PostsService) {}

  // ✅ CREATE POST
  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.id, dto); // ✅ FIX
  }

  // ✅ UPDATE POST
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.service.update(id, user.id, dto); // ✅ FIX
  }

  // ✅ DELETE POST
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.id); // ✅ FIX
  }

  // ✅ GET ALL POSTS
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ✅ GET POSTS BY USER
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.service.findByUser(id);
  }

  // ✅ FEED
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  feed(@CurrentUser() user: any) {
    return this.service.getFeed(user.id); // ✅ FIX
  }
}