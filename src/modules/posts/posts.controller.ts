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

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@CurrentUser() user, @Body() dto) {
    return this.service.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user, @Body() dto) {
    return this.service.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user) {
    return this.service.delete(id, user.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.service.findByUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  feed(@CurrentUser() user) {
    return this.service.getFeed(user.sub);
  }
}