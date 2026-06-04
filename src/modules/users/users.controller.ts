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

  // ============================
  // ✅ GET ALL USERS
  // ============================
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.service.findAll();
  }

  // ============================
  // ✅ SEARCH USER
  // ============================
  @Get('search')
  @ApiOperation({ summary: 'Search users by keyword' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  // ============================
  // ✅ GET CURRENT USER
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.service.findById(user.id, user.id); // ✅ FIX
  }

  // ============================
  // ✅ GET USER BY ID (FULL PROFILE)
  // ============================
  @UseGuards(JwtAuthGuard) // ✅ để có mutual count
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  findById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findById(id, user?.id); // ✅ FIX
  }

  // ============================
  // ✅ UPDATE PROFILE
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  update(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateProfile(user.id, dto);
  }
}