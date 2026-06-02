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

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ✅ GET ALL USERS
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.service.findAll();
  }

  // ✅ SEARCH USER
  @Get('search')
  @ApiOperation({ summary: 'Search users by keyword' })
  @ApiQuery({ name: 'q', required: true, description: 'Search keyword' })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  // ✅ GET CURRENT USER 🔥 (QUAN TRỌNG NHẤT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.service.findById(user.id); // ✅ dùng id từ JwtStrategy
  }

  // ✅ GET USER BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ✅ UPDATE CURRENT USER PROFILE
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateProfile(user.id, dto); // ✅ dùng id
  }
}