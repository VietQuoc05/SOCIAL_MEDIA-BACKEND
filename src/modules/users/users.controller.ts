import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  // ✅ GET ALL USERS
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.service.findAll();
  }

  // ✅ SEARCH USER
  @Get('search')
  @ApiOperation({ summary: 'Search users by keyword' })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  // ✅ GET CURRENT USER (FIX QUAN TRỌNG 🔥)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.service.findById(user.id); // ✅ dùng id đã map ở JwtStrategy
  }

  // ✅ GET USER BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ✅ UPDATE PROFILE
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateProfile(user.id, dto); // ✅ dùng id
  }
}
``